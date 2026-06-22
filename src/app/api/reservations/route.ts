import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { createBookingReservation } from "@/app/actions/reservations";

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as "owner" | "sitter" | null;
  const status = searchParams.get("status");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const db = createServiceClient();

  // sitter 역할이면 sitter 프로필 조회
  let sitterId: string | null = null;
  if (role === "sitter") {
    const { data: sitterProfile } = await db
      .from("sitters")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sitterProfile) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "펫시터 프로필이 없습니다." } },
        { status: 403 },
      );
    }
    sitterId = sitterProfile.id;
  }

  // 커서 기반 페이지네이션
  let cursorCreatedAt: string | null = null;
  if (cursor) {
    const { data: cursorItem } = await db
      .from("reservations")
      .select("created_at")
      .eq("id", cursor)
      .single();
    cursorCreatedAt = cursorItem?.created_at ?? null;
  }

  let query = db
    .from("reservations")
    .select(
      `id, owner_id, sitter_id, service_id, request_id, application_id,
       start_datetime, end_datetime, total_price, status, memo,
       accepted_at, paid_at, completed_at, canceled_at,
       reservation_items(pets(id, name, animal_type, breed, image_url))`,
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (role === "owner") {
    query = query.eq("owner_id", user.id);
  } else if (role === "sitter" && sitterId) {
    query = query.eq("sitter_id", sitterId);
  } else {
    // role 미지정 시 본인 관련 예약 전체
    query = query.or(`owner_id.eq.${user.id},sitter_id.in.(${sitterId ?? ""})`);
  }

  if (status) query = query.eq("status", status);
  if (cursorCreatedAt) query = query.lt("created_at", cursorCreatedAt);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const reservations = items.map((item) => {
    const { reservation_items, ...rest } = item as typeof item & {
      reservation_items: { pets: object }[] | null;
    };
    return {
      ...rest,
      pets: (reservation_items ?? []).map((ri) => ri.pets),
    };
  });

  return NextResponse.json({ data: { reservations, next_cursor: nextCursor } });
}

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "요청 본문이 없습니다." } },
      { status: 400 },
    );
  }

  const { sitter_id, service_id, pet_ids, start_datetime, end_datetime, total_price, payment_id, pay_method, memo } = body;

  if (!sitter_id || !service_id || !Array.isArray(pet_ids) || !pet_ids.length || !start_datetime || !end_datetime || !total_price || !payment_id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "필수 항목이 누락되었습니다." } },
      { status: 400 },
    );
  }

  const result = await createBookingReservation({
    sitter_id,
    service_id,
    pet_ids,
    start_datetime,
    end_datetime,
    total_price,
    payment_id,
    pay_method: pay_method ?? "CARD",
    memo: memo ?? null,
  });

  if (result.error) {
    const status =
      result.error.code === "UNAUTHORIZED" ? 401 :
      result.error.code === "FORBIDDEN" ? 403 :
      result.error.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
