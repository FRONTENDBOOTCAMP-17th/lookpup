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

export async function createReport(input: {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  content?: string | null;
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
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}
