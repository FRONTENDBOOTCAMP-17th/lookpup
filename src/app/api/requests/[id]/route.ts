import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/requests/[id] — 구인글 상세 (조회)
//
// 팀 컨벤션(API_USAGE.md): 조회는 API 라우트, 쓰기는 Server Action(actions/requests.ts).

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("requests")
    .select(
      `*, users!owner_id(full_name, profile_image, is_verified, created_at), pets!pet_id(*), applications(*, sitters(id, users!user_id(full_name, profile_image)))`,
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
