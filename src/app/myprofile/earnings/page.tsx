import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import EarningsClient from "@/components/myprofile/EarningsClient";

export default async function EarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <EarningsClient />;

  const db = createServiceClient();

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile) return <EarningsClient />;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const weekAgoStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twelveMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

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

  const paidPayments = (payments ?? []).filter((p) => p.status === "paid");

  const total = paidPayments.reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
  const thisMonth = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= thisMonthStart && p.paid_at < nextMonthStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
  const thisWeek = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= weekAgoStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTotal = (monthlyPayments ?? [])
      .filter((p) => (p.paid_at ?? "").slice(0, 7) === key)
      .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
    return { month: key, label: `${d.getMonth() + 1}월`, total: monthTotal };
  });

  const transactions = (payments ?? []).map((p) => ({
    id: p.id,
    date: (p.paid_at ?? p.created_at ?? "").slice(0, 10),
    service:
      (p.reservations as { services: { title: string } | null } | null)?.services?.title ?? "-",
    clientName:
      (p.reservations as { users: { full_name: string } | null } | null)?.users?.full_name ?? "-",
    amount: p.settle_amount ?? 0,
    status: (p.status === "paid" ? "completed" : "pending") as "completed" | "pending",
  }));

  return (
    <EarningsClient initialData={{ total, thisMonth, thisWeek, monthly, transactions }} />
  );
}
