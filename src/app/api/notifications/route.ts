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
  const isReadParam = searchParams.get("is_read");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const db = createServiceClient();

  let cursorCreatedAt: string | null = null;
  if (cursor) {
    const { data: cursorItem } = await db
      .from("notifications")
      .select("created_at")
      .eq("id", cursor)
      .eq("user_id", user.id)
      .single();
    cursorCreatedAt = cursorItem?.created_at ?? null;
  }

  let query = db
    .from("notifications")
    .select("id, type, title, content, is_read, link_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (isReadParam !== null) query = query.eq("is_read", isReadParam === "true");
  if (cursorCreatedAt) query = query.lt("created_at", cursorCreatedAt);

  const [{ data, error }, { count: unreadTotal }, { data: unreadTypeRows }] =
    await Promise.all([
      query,
      db
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      db
        .from("notifications")
        .select("type")
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // 알림 설정 토글(클라이언트 localStorage)에서 타입별로 배지 카운트를 거르기 위한 분포
  const unreadByType: Record<string, number> = {};
  for (const row of unreadTypeRows ?? []) {
    unreadByType[row.type] = (unreadByType[row.type] ?? 0) + 1;
  }

  return NextResponse.json({
    data: {
      notifications: items,
      unread_total: unreadTotal ?? 0,
      unread_by_type: unreadByType,
      next_cursor: nextCursor,
    },
  });
}
