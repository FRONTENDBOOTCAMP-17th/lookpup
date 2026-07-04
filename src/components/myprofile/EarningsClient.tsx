"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Building2, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import EarningsSummaryCards from "@/components/myprofile/earnings/EarningsSummaryCards";
import EarningsChart from "@/components/myprofile/earnings/EarningsChart";
import EarningsTransactions from "@/components/myprofile/earnings/EarningsTransactions";
import { useEarnings } from "@/hooks/queries/useEarnings";
import type { EarningsData } from "@/types/earnings";

export default function EarningsClient({
  initialData,
  hasBankAccount,
}: {
  initialData?: EarningsData | null;
  hasBankAccount?: boolean;
}) {
  const router = useRouter();
  const { data, isLoading } = useEarnings(initialData ?? undefined);
  const earnings = data ?? { total: 0, thisMonth: 0, thisWeek: 0, monthly: [], transactions: [] };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <MobileBackButton />
          <span className="flex-1 font-semibold text-stone-900">수익 관리</span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <DesktopBackButton />
            <div>
              <h2 className="text-2xl font-bold text-[#281A0E]">수익 관리</h2>
              <p className="text-sm text-[#6B7280] mt-1">펫시터 활동 수익을 확인하세요</p>
            </div>
          </div>
        </div>

        {hasBankAccount === false && (
          <Link
            href="/myprofile/settings?tab=bank"
            className="group relative mb-6 flex items-center gap-4 p-5 rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A2F1C] via-[#8C5A32] to-[var(--color-orange-500)] shadow-[0_2px_12px_rgba(120,86,50,0.18)] hover:shadow-[0_4px_16px_rgba(120,86,50,0.24)] transition-shadow"
          >
            <div className="pointer-events-none absolute -right-6 -top-10 w-32 h-32 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -right-2 bottom-[-2.5rem] w-24 h-24 rounded-full bg-white/15" />

            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold leading-tight">정산 계좌를 등록해주세요</p>
              <p className="text-white/85 text-xs mt-1">계좌 등록 후 수익금을 정산받을 수 있어요</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-white text-sm font-semibold pl-2">
              <span className="hidden sm:inline">등록하기</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )}

        <EarningsSummaryCards
          isLoading={isLoading}
          total={earnings.total}
          thisMonth={earnings.thisMonth}
          thisWeek={earnings.thisWeek}
        />

        <EarningsChart isLoading={isLoading} monthly={earnings.monthly} />

        <EarningsTransactions isLoading={isLoading} transactions={earnings.transactions} />
      </div>
    </div>
  );
}
