import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sitter } = await db
    .from("sitters")
    .select("id")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!sitter) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "펫시터를 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const { data, error } = await db
    .from("services")
    .select("id, sitter_id, title, service_type, animal_type, price, description, is_active")
    .eq("sitter_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
