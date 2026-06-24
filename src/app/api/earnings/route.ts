import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

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
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const weekAgoStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const paidPayments = payments.filter((p) => p.status === "paid");

  const total = paidPayments.reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);

  const thisMonth = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= thisMonthStart && p.paid_at < nextMonthStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);

  const thisWeek = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= weekAgoStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);

  const transactions = payments.map((p) => {
    const dateStr = (p.paid_at ?? p.created_at ?? "").slice(0, 10);
    return {
      id: p.id,
      date: dateStr,
      service: p.reservations?.services?.title ?? "-",
      clientName: p.reservations?.users?.full_name ?? "-",
      amount: p.settle_amount ?? 0,
      status: p.status === "paid" ? "completed" : "pending",
    };
  });

  return NextResponse.json({ data: { total, thisMonth, thisWeek, transactions } });
}
