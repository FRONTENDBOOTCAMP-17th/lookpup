import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { parseArea } from "@/utils/petsitterArea";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sitter, error } = await db
    .from("sitters")
    .select(
      `id, title, introduction, career, available_area,
       base_price, rating, status, request_type,
       users!inner(full_name, profile_image, is_verified),
       services(id, service_type, title, price, description, is_active, animal_type)`,
    )
    .eq("id", id)
    .eq("status", "approved")
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

  const { full_name, profile_image, is_verified } = sitter.users;
  const { city, district, neighborhood } = parseArea(sitter.available_area);

  return NextResponse.json({
    data: {
      id: sitter.id,
      full_name,
      profile_image,
      title: sitter.title,
      introduction: sitter.introduction,
      career: sitter.career,
      available_area: [city, district, neighborhood].filter(Boolean).join(" "),
      base_price: sitter.base_price,
      rating: sitter.rating,
      status: sitter.status,
      is_verified,
      services: (sitter.services ?? []).filter(
        (service: { is_active: boolean }) => service.is_active,
      ),
      review_count: reviewCount ?? 0,
    },
  });
}
