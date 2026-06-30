import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type SearchSittersWithinArgs = {
  lat: number;
  lng: number;
  radius_km: number;
  service_types: string[] | null;
  animal_types: string[] | null;
  price_min: number | null;
  price_max: number | null;
  rating_min: number | null;
};

type SearchSitterRow = Record<string, unknown>;

type SearchSittersRpc = (
  fn: "search_sitters_within",
  args: SearchSittersWithinArgs,
) => Promise<{
  data: SearchSitterRow[] | null;
  error: { message: string } | null;
}>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseNumberParam(value: string | null, fallback: number) {
  const parsed = value == null ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseListParam(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).slice(0, 10);
}

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

  const radius = clamp(parseNumberParam(searchParams.get("radius"), 5), 1, 30);
  const serviceTypes = parseListParam(searchParams.getAll("service_type"));
  const animalTypes = parseListParam(searchParams.getAll("animal_type"));
  const rawPriceMin = parseNumberParam(searchParams.get("price_min"), NaN);
  const rawPriceMax = parseNumberParam(searchParams.get("price_max"), NaN);
  const rawRatingMin = parseNumberParam(searchParams.get("rating_min"), NaN);
  const priceMin =
    Number.isFinite(rawPriceMin) && rawPriceMin >= 0
      ? Math.floor(rawPriceMin)
      : null;
  const priceMax =
    Number.isFinite(rawPriceMax) && rawPriceMax >= 0
      ? Math.floor(rawPriceMax)
      : null;
  const ratingMin = Number.isFinite(rawRatingMin)
    ? clamp(rawRatingMin, 0, 5)
    : null;
  const page = Math.max(
    1,
    Math.floor(parseNumberParam(searchParams.get("page"), 1)),
  );
  const limit = clamp(
    Math.floor(parseNumberParam(searchParams.get("limit"), 20)),
    1,
    50,
  );

  const db = createServiceClient();
  const searchSittersWithin = db.rpc as unknown as SearchSittersRpc;

  const { data, error } = await searchSittersWithin("search_sitters_within", {
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
