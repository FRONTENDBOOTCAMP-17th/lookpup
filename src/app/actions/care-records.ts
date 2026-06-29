"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import type { CareRecordPayload } from "@/components/common/chat/CareRecordModal";
import { createNotification } from "@/lib/notificationHelpers";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function createCareRecord(payload: CareRecordPayload) {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };

  if (!payload.reservationId) {
    return { error: { code: "VALIDATION_ERROR", message: "예약 정보가 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile) {
    return { error: { code: "FORBIDDEN", message: "펫시터만 돌봄기록을 작성할 수 있습니다." } };
  }

  const { data, error } = await db
    .from("care_records")
    .insert({
      reservation_id: payload.reservationId,
      sitter_id: sitterProfile.id,
      type: payload.type,
      service_type: payload.serviceType ?? null,
      title: payload.title,
      status_text: payload.statusText,
      content: payload.content,
      fields: payload.fields,
      image_urls: payload.imageUrls,
    })
    .select()
    .single();

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  const { data: reservation } = await db
    .from("reservations")
    .select("owner_id")
    .eq("id", payload.reservationId)
    .single();

  if (reservation) {
    const { data: sitterUser } = await db
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const sitterName = sitterUser?.full_name ?? "펫시터";

    await createNotification({
      userId: reservation.owner_id,
      type: "care_record",
      title: "돌봄기록이 도착했어요",
      content: `${sitterName}님이 '${payload.title}'을 기록했습니다.`,
      linkUrl: `/myprofile/booking-history/${payload.reservationId}`,
    });
  }

  return { data };
}

export interface CareRecord {
  id: string;
  reservation_id: string;
  sitter_id: string;
  type: string;
  service_type: string | null;
  title: string;
  status_text: string;
  content: string;
  fields: Record<string, string>;
  image_urls: string[];
  created_at: string;
}

export async function getInProgressReservationByOwnerAndSitter(ownerId: string, sitterId: string) {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };

  const db = createServiceClient();

  const { data, error } = await db
    .from("reservations")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("sitter_id", sitterId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };
  if (!data) return { error: { code: "NOT_FOUND", message: "진행 중인 예약이 없습니다." } };

  return { data: { id: data.id } };
}

export async function getCareRecordsByReservationId(reservationId: string) {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select("owner_id, sitter_id")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) return { error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };

  const isOwner = reservation.owner_id === user.id;

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isSitter = sitterProfile?.id === reservation.sitter_id;

  if (!isOwner && !isSitter) {
    return { error: { code: "FORBIDDEN", message: "권한이 없습니다." } };
  }

  const { data, error } = await db
    .from("care_records")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  return { data: (data ?? []) as CareRecord[] };
}
