import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("reservations")
    .select("start_datetime, end_datetime")
    .eq("sitter_id", id)
    .in("status", ["pending", "accepted", "paid", "in_progress"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((r) => ({
      from: r.start_datetime,
      to: r.end_datetime,
    })),
  });
}
