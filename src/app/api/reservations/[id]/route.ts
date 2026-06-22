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

  const { data, error } = await db
    .from("reservations")
    .select(
      `id, owner_id, sitter_id, service_id, start_datetime, end_datetime,
       total_price, status, completed_at,
       sitters(users(full_name, profile_image)),
       services(service_type),
       reservation_items(pets(id, name, animal_type))`,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const row = data as any;

  if (row.owner_id !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "접근 권한이 없습니다." } },
      { status: 403 },
    );
  }

  return NextResponse.json({
    data: {
      id: row.id,
      owner_id: row.owner_id,
      sitter_id: row.sitter_id,
      start_datetime: row.start_datetime,
      end_datetime: row.end_datetime,
      total_price: row.total_price,
      status: row.status,
      completed_at: row.completed_at,
      sitter_full_name: row.sitters?.users?.full_name ?? null,
      sitter_profile_image: row.sitters?.users?.profile_image ?? null,
      service_type: row.services?.service_type ?? null,
      pets: (row.reservation_items ?? [])
        .map((ri: any) => ri.pets)
        .filter(Boolean),
    },
  });
}
