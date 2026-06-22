"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// 댓글 쓰기(mutation)만 Server Action. 조회는 API 라우트(GET /api/requests/[id]/comments).
// 팀 컨벤션(API_USAGE.md): 조회는 API 라우트, 쓰기는 Server Action.
//
// 주의: comments 테이블이 아직 DB에 없음. 테이블 생성 후 바로 동작하도록 작성해 둠.
// (테이블 생성 SQL은 별도 전달 — request_id/user_id/content/created_at 평면 구조)

export async function createComment(requestId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return {
      error: { code: "VALIDATION_ERROR", message: "댓글 내용을 입력해주세요." },
    };
  }

  // RLS SELECT/INSERT 정책 없이 service client로 우회 (기존 requests 패턴과 동일)
  const db = createServiceClient();

  const { data, error } = await db
    .from("comments")
    .insert({
      id: crypto.randomUUID(),
      request_id: requestId,
      user_id: user.id,
      content: trimmed,
    })
    .select("*, users!user_id(full_name, profile_image)")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}
