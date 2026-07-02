"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" as const };

  const db = createServiceClient();
  const { data: userRow } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (userRow?.role !== "admin") return { error: "FORBIDDEN" as const };
  return { userId: user.id };
}

async function resolveUserId(db: ReturnType<typeof createServiceClient>, targetId: string, targetType: "user" | "sitter") {
  if (targetType === "user") return targetId;
  const { data: sitter } = await db.from("sitters").select("user_id").eq("id", targetId).single();
  return sitter?.user_id ?? null;
}

export async function adminSuspendUser(
  targetId: string,
  targetType: "user" | "sitter",
  suspendedUntil: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();
  const userId = await resolveUserId(db, targetId, targetType);
  if (!userId) return { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." } };

  const { error } = await db
    .from("users")
    .update({ suspended_until: suspendedUntil })
    .eq("id", userId)
    .is("deleted_at", null);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };
  return { data: { suspended_until: suspendedUntil } };
}

export async function adminUnsuspendUser(targetId: string, targetType: "user" | "sitter") {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();
  const userId = await resolveUserId(db, targetId, targetType);
  if (!userId) return { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." } };

  const { error } = await db
    .from("users")
    .update({ suspended_until: null })
    .eq("id", userId)
    .is("deleted_at", null);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };
  return { data: { unsuspended: true } };
}

export async function adminDemoteUser(targetId: string, targetType: "user" | "sitter") {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();
  const userId = await resolveUserId(db, targetId, targetType);
  if (!userId) return { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." } };

  const { data: target } = await db
    .from("users")
    .select("role")
    .eq("id", userId)
    .is("deleted_at", null)
    .single();

  if (!target) return { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." } };
  if (target.role !== "both") {
    return { error: { code: "BAD_REQUEST", message: "펫시터 권한이 없는 사용자입니다." } };
  }

  const { error } = await db
    .from("users")
    .update({ role: "owner" })
    .eq("id", userId);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  return { data: { demoted: true } };
}

export async function adminCancelRequest(requestId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();

  const { data: request } = await db
    .from("requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (!request) return { error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." } };
  if (request.status === "canceled") {
    return { error: { code: "BAD_REQUEST", message: "이미 취소된 구인글입니다." } };
  }

  const { error } = await db
    .from("requests")
    .update({ status: "canceled" })
    .eq("id", requestId);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  return { data: { canceled: true } };
}

export async function getAdminReports() {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." }, data: null };

  const db = createServiceClient();
  const { data, error } = await db
    .from("reports")
    .select(
      `id, reporter_id, target_type, target_id, reason, content, status,
       image_urls, admin_memo, handled_by, handled_at, created_at, updated_at,
       reporter:users!reports_reporter_id_fkey(id, full_name, profile_image, email)`
    )
    .order("created_at", { ascending: false });

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message }, data: null };
  return { data, error: null };
}

export type ReservationStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled";

export async function getAdminReservations() {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." }, data: null };

  const db = createServiceClient();
  const { data, error } = await db
    .from("reservations")
    .select(
      `id, status, total_price, start_datetime, end_datetime,
       accepted_at, started_at, completed_at, canceled_at, paid_at, created_at,
       cancel_reason, memo,
       owner:users!reservations_owner_id_fkey(id, full_name, email, profile_image),
       sitter:sitters!reservations_sitter_id_fkey(id, user_id, users(full_name, email, profile_image))`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message }, data: null };
  return { data, error: null };
}

export async function adminUpdateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  cancelReason?: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select("status")
    .eq("id", reservationId)
    .single();

  if (!reservation) return { error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };

  const now = new Date().toISOString();
  const updates: { status: string; accepted_at?: string; started_at?: string; completed_at?: string; canceled_at?: string; cancel_reason?: string | null } = { status };

  if (status === "accepted") updates.accepted_at = now;
  else if (status === "in_progress") updates.started_at = now;
  else if (status === "completed") updates.completed_at = now;
  else if (status === "canceled") {
    updates.canceled_at = now;
    updates.cancel_reason = cancelReason ?? null;
  }

  const { error } = await db
    .from("reservations")
    .update(updates)
    .eq("id", reservationId);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };
  return { data: { status } };
}

export async function adminDeactivateService(serviceId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();

  const { data: service } = await db
    .from("services")
    .select("is_active")
    .eq("id", serviceId)
    .single();

  if (!service) return { error: { code: "NOT_FOUND", message: "서비스를 찾을 수 없습니다." } };
  if (!service.is_active) {
    return { error: { code: "BAD_REQUEST", message: "이미 비활성화된 서비스입니다." } };
  }

  const { error } = await db
    .from("services")
    .update({ is_active: false })
    .eq("id", serviceId);

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  return { data: { deactivated: true } };
}
