"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

type ReportTargetType =
  | "user"
  | "sitter"
  | "request"
  | "service"
  | "reservation"
  | "review"
  | "message";

type ReportStatus = "pending" | "processing" | "completed" | "rejected";

export async function createReport(input: {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  content?: string | null;
  image_urls?: string[] | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!input.reason || input.reason.trim().length === 0) {
    return { error: { code: "VALIDATION_ERROR", message: "신고 사유를 입력해주세요." } };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason,
      content: input.content ?? null,
      image_urls: input.image_urls ?? [],
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

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


export async function updateReport(input: {
  id: string;
  status: ReportStatus;
  admin_memo?: string | null;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: { code: auth.error, message: "권한이 없습니다." } };

  const db = createServiceClient();

  const { data, error } = await db
    .from("reports")
    .update({
      status: input.status,
      admin_memo: input.admin_memo ?? null,
      handled_by: auth.userId,
      handled_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("id, status, admin_memo, handled_by, handled_at")
    .single();

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message } };

  return { data };
}
