import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { buildEarningsData, getEarningsDateRanges } from "@/utils/earnings";
import type { EarningsPaymentRow, EarningsMonthlyPaymentRow } from "@/utils/earnings";
import EarningsClient from "@/components/myprofile/EarningsClient";

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <EarningsClient />;

  const db = createServiceClient();

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile) return <EarningsClient />;

  // bank_accounts가 generated types에 없어서 타입 우회
  const { data: bankAccount } = (await (db as any)
    .from("bank_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()) as { data: { id: string } | null };

  const now = new Date();
  const { twelveMonthsAgoStart } = getEarningsDateRanges(now);

  const [{ data: payments }, { data: monthlyPayments }] = await Promise.all([
    db
      .from("payments")
      .select(
        `id, settle_amount, status, paid_at, created_at,
         reservations!inner(start_datetime, services(title), users(full_name))`,
      )
      .eq("sitter_id", sitterProfile.id)
      .in("status", ["paid", "ready"])
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("payments")
      .select("settle_amount, paid_at")
      .eq("sitter_id", sitterProfile.id)
      .eq("status", "paid")
      .gte("paid_at", twelveMonthsAgoStart),
  ]);

  const earningsData = buildEarningsData(
    (payments ?? []) as unknown as EarningsPaymentRow[],
    (monthlyPayments ?? []) as EarningsMonthlyPaymentRow[],
    now,
  );

  return <EarningsClient initialData={earningsData} hasBankAccount={!!bankAccount} />;
}
