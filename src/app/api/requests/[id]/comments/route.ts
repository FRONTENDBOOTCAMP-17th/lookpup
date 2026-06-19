import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/requests/[id]/comments — 구인글 댓글 목록 (조회)
//
// 팀 컨벤션(API_USAGE.md): 조회는 API 라우트, 쓰기는 Server Action(actions/comments.ts).
// 주의: comments 테이블이 아직 DB에 없음. 테이블 생성 후 바로 동작하도록 작성해 둠.
// 테이블이 없는 동안에는 error가 나므로 FE에서 빈 목록(더미 fallback)으로 처리.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("comments")
    .select("*, users!user_id(full_name, profile_image)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
