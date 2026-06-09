import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "lat, lng는 필수입니다." } },
      { status: 400 },
    );
  }

  const radius = parseFloat(searchParams.get("radius") ?? "5");
  const serviceTypes = searchParams.getAll("service_type");
  const animalTypes = searchParams.getAll("animal_type");
  const priceMin = searchParams.get("price_min") ? parseInt(searchParams.get("price_min")!) : null;
  const priceMax = searchParams.get("price_max") ? parseInt(searchParams.get("price_max")!) : null;
  const ratingMin = searchParams.get("rating_min") ? parseFloat(searchParams.get("rating_min")!) : null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const db = createServiceClient();

  const { data, error } = await db.rpc("search_sitters_within", {
    lat,
    lng,
    radius_km: radius,
    service_types: serviceTypes.length > 0 ? serviceTypes : null,
    animal_types: animalTypes.length > 0 ? animalTypes : null,
    price_min: priceMin,
    price_max: priceMax,
    rating_min: ratingMin,
  });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const total = data?.length ?? 0;
  const offset = (page - 1) * limit;
  const sitters = (data ?? []).slice(offset, offset + limit);

  return NextResponse.json({ data: { sitters, total } });
}
