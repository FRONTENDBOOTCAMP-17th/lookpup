import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sitterId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const db = createServiceClient();

  let cursorCreatedAt: string | null = null;
  if (cursor) {
    const { data: cursorItem } = await db
      .from("reviews")
      .select("created_at")
      .eq("id", cursor)
      .eq("sitter_id", sitterId)
      .single();
    cursorCreatedAt = cursorItem?.created_at ?? null;
  }

  let query = db
    .from("reviews")
    .select(
      `id, owner_id, rating, content, image_urls, tags, detail_ratings, created_at,
       users!inner(full_name, profile_image)`,
    )
    .eq("sitter_id", sitterId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

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

  const reviews = items.map((item) => {
    return {
      id: item.id,
      owner_id: item.owner_id,
      owner_full_name: item.users.full_name ?? "알 수 없음",
      owner_profile_image: item.users.profile_image ?? null,
      rating: item.rating,
      content: item.content,
      image_urls: item.image_urls ?? [],
      tags: item.tags ?? [],
      detail_ratings: (item.detail_ratings as Record<string, number>) ?? {},
      created_at: item.created_at,
    };
  });

  const { data: allRatings } = await db
    .from("reviews")
    .select("rating")
    .eq("sitter_id", sitterId);

  const total = allRatings?.length ?? 0;
  const averageRating =
    total > 0
      ? parseFloat(
          (allRatings!.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(
            1,
          ),
        )
      : 0;

  return NextResponse.json({
    data: {
      reviews,
      average_rating: averageRating,
      total,
      next_cursor: nextCursor,
    },
  });
}
