import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }

  const db = createServiceClient();

  const { data: requestRow } = await db
    .from("requests")
    .select("id, owner_id")
    .eq("id", id)
    .single();

  if (!requestRow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const isOwner = requestRow.owner_id === user.id;

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isOwner) {
    if (!sitterProfile) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "조회 권한이 없습니다." } },
        { status: 403 },
      );
    }

    const { data: ownApplication } = await db
      .from("applications")
      .select("id")
      .eq("request_id", id)
      .eq("sitter_id", sitterProfile.id)
      .maybeSingle();

    if (!ownApplication) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "조회 권한이 없습니다." } },
        { status: 403 },
      );
    }
  }

  let query = db
    .from("applications")
    .select(
      `id, sitter_id, message, proposed_price, status, created_at,
       sitters!inner(
         rating,
         users!inner(full_name, profile_image)
       )`,
    )
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (!isOwner && sitterProfile) {
    query = query.eq("sitter_id", sitterProfile.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const applications = (data ?? []).map((item) => {
    return {
      id: item.id,
      sitter_id: item.sitter_id,
      sitter_full_name: item.sitters.users.full_name ?? "알 수 없음",
      sitter_profile_image: item.sitters.users.profile_image ?? null,
      sitter_rating: item.sitters.rating,
      message: item.message,
      proposed_price: item.proposed_price,
      status: item.status,
      created_at: item.created_at,
    };
  });

  return NextResponse.json({ data: applications });
}
