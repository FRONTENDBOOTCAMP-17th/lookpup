import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// 조회만 API 라우트. 생성/수정/삭제는 팀 컨벤션(API_USAGE.md)대로 Server Action(actions/requests.ts).
// RLS SELECT 정책이 없어 anon 조회가 빈 결과 → service client로 우회.

// GET /api/requests
//   ?status=open  → 공개 목록 (board/page) — 로그인 불필요
//   ?mine=true    → 내 구인글 (myprofile/posts) — 로그인 필요, 지원/예약 조인 포함

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";
  const status = searchParams.get("status");
  const requestType = searchParams.get("request_type");

  const db = createServiceClient();

  if (mine) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    // request_pets 테이블이 없어 pets!pet_id 단일 FK로 조인
    const { data, error } = await db
      .from("requests")
      .select(
        `*, pets!pet_id(name, animal_type), applications(status, sitters(users!user_id(full_name))), reservations(status)`,
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  }

  let query = db
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (requestType) query = query.eq("request_type", requestType);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
