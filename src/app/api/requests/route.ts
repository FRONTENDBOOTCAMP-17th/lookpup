import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

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
  const status = searchParams.get("status");
  const requestType = searchParams.get("request_type");
  const ownerId = searchParams.get("owner_id");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  if (ownerId && ownerId !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "본인 구인글만 조회할 수 있습니다." } },
      { status: 403 },
    );
  }

  const db = createServiceClient();

  let cursorCreatedAt: string | null = null;
  if (cursor) {
    const { data: cursorItem } = await db
      .from("requests")
      .select("created_at")
      .eq("id", cursor)
      .single();
    cursorCreatedAt = cursorItem?.created_at ?? null;
  }

  let query = db
    .from("requests")
    .select(
      `id, owner_id, title, content, request_type,
       start_datetime, end_datetime, budget, location, status, created_at,
       users!inner(full_name),
       request_pets(pet_id)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (requestType) query = query.eq("request_type", requestType);
  if (ownerId) query = query.eq("owner_id", ownerId);
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

  const requests = items.map((item) => {
    const { users, request_pets, ...rest } = item as typeof item & {
      users: { full_name: string };
      request_pets: { pet_id: string }[];
    };
    return {
      ...rest,
      owner_full_name: users.full_name,
      pet_ids: (request_pets ?? []).map((rp) => rp.pet_id),
    };
  });

  return NextResponse.json({ data: { requests, next_cursor: nextCursor } });
}
