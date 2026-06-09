import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sitter, error } = await db
    .from("sitters")
    .select(
      `id, user_id, title, introduction, career, available_area,
       latitude, longitude, base_price, rating, status, is_verified,
       users!inner(full_name, profile_image),
       services(id, service_type, title, price, description, is_active, animal_type)`,
    )
    .eq("id", id)
    .single();

  if (error || !sitter) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "펫시터를 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const { count: reviewCount } = await db
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("sitter_id", id);

  const { full_name, profile_image } = sitter.users as { full_name: string; profile_image: string | null };

  return NextResponse.json({
    data: {
      id: sitter.id,
      user_id: sitter.user_id,
      full_name,
      profile_image,
      title: sitter.title,
      introduction: sitter.introduction,
      career: sitter.career,
      available_area: sitter.available_area,
      latitude: sitter.latitude,
      longitude: sitter.longitude,
      base_price: sitter.base_price,
      rating: sitter.rating,
      status: sitter.status,
      is_verified: sitter.is_verified,
      services: sitter.services,
      review_count: reviewCount ?? 0,
    },
  });
}
