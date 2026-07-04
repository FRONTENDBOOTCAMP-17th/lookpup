import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { buildEarningsData, getEarningsDateRanges } from "@/utils/earnings";
import type { EarningsPaymentRow, EarningsMonthlyPaymentRow } from "@/utils/earnings";

export async function GET() {
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

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "펫시터 프로필이 없습니다." } },
      { status: 403 },
    );
  }

  const { data: payments, error } = await db
    .from("payments")
    .select(
      `id, settle_amount, status, paid_at, created_at,
       reservations!inner(
         start_datetime,
         services(title),
         users(full_name)
       )`,
    )
    .eq("sitter_id", sitterProfile.id)
    .in("status", ["paid", "ready"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const now = new Date();
  const { twelveMonthsAgoStart } = getEarningsDateRanges(now);

  const { data: monthlyPayments, error: monthlyError } = await db
    .from("payments")
    .select("settle_amount, paid_at")
    .eq("sitter_id", sitterProfile.id)
    .eq("status", "paid")
    .gte("paid_at", twelveMonthsAgoStart);

  if (monthlyError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: monthlyError.message } },
      { status: 500 },
    );
  }

  const earningsData = buildEarningsData(
    payments as unknown as EarningsPaymentRow[],
    monthlyPayments as EarningsMonthlyPaymentRow[],
    now,
  );

  return NextResponse.json({ data: earningsData });
}
