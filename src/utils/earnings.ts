import type { EarningsData, MonthlyEarning, Transaction } from "@/types/earnings";

export interface EarningsPaymentRow {
  id: string;
  settle_amount: number | null;
  status: string;
  paid_at: string | null;
  created_at: string | null;
  reservations: {
    services: { title: string | null } | null;
    users: { full_name: string | null } | null;
  } | null;
}

export interface EarningsMonthlyPaymentRow {
  settle_amount: number | null;
  paid_at: string | null;
}

interface EarningsDateRanges {
  thisMonthStart: string;
  nextMonthStart: string;
  weekAgoStart: string;
  twelveMonthsAgoStart: string;
}

export function formatEarningsCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function getEarningsDateRanges(now: Date): EarningsDateRanges {
  return {
    thisMonthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    nextMonthStart: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    weekAgoStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    twelveMonthsAgoStart: new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString(),
  };
}

function buildMonthlySeries(
  monthlyPayments: EarningsMonthlyPaymentRow[],
  now: Date,
): MonthlyEarning[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTotal = monthlyPayments
      .filter((p) => (p.paid_at ?? "").slice(0, 7) === key)
      .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
    return { month: key, label: `${d.getMonth() + 1}월`, total: monthTotal };
  });
}

function buildTransactions(payments: EarningsPaymentRow[]): Transaction[] {
  return payments.map((p) => ({
    id: p.id,
    date: (p.paid_at ?? p.created_at ?? "").slice(0, 10),
    service: p.reservations?.services?.title ?? "-",
    clientName: p.reservations?.users?.full_name ?? "-",
    amount: p.settle_amount ?? 0,
    status: p.status === "paid" ? "completed" : "pending",
  }));
}

export function buildEarningsData(
  payments: EarningsPaymentRow[],
  monthlyPayments: EarningsMonthlyPaymentRow[],
  now: Date = new Date(),
): EarningsData {
  const { thisMonthStart, nextMonthStart, weekAgoStart } = getEarningsDateRanges(now);

  const paidPayments = payments.filter((p) => p.status === "paid");

  const total = paidPayments.reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
  const thisMonth = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= thisMonthStart && p.paid_at < nextMonthStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);
  const thisWeek = paidPayments
    .filter((p) => p.paid_at && p.paid_at >= weekAgoStart)
    .reduce((sum, p) => sum + (p.settle_amount ?? 0), 0);

  return {
    total,
    thisMonth,
    thisWeek,
    monthly: buildMonthlySeries(monthlyPayments, now),
    transactions: buildTransactions(payments),
  };
}
