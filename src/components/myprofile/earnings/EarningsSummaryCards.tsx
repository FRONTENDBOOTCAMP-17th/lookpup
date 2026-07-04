import { TrendingUp, Calendar } from "lucide-react";
import { formatEarningsCurrency as formatCurrency } from "@/utils/earnings";

interface EarningsSummaryCardsProps {
  isLoading: boolean;
  total: number;
  thisMonth: number;
  thisWeek: number;
}

export default function EarningsSummaryCards({
  isLoading,
  total,
  thisMonth,
  thisWeek,
}: EarningsSummaryCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-orange-500)] to-[#F5A05A] text-white shadow-[0_2px_12px_rgba(232,116,42,0.2)]">
        <div className="flex items-start justify-between mb-3">
          <p className="text-white/80 text-sm font-medium">이번 달 수익</p>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold mb-1">{isLoading ? "-" : formatCurrency(thisMonth)}</p>
        <p className="text-white/70 text-sm">
          {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-[#FFE9D6] shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[#6B7280] text-sm font-medium">총 수익</p>
          <div className="w-10 h-10 rounded-full bg-[#FFF8F3] flex items-center justify-center">
            <TrendingUp size={20} className="text-[var(--color-orange-500)]" />
          </div>
        </div>
        <p className="text-3xl font-bold mb-1 text-[#281A0E]">
          {isLoading ? "-" : formatCurrency(total)}
        </p>
        <p className="text-[#6B7280] text-sm">누적 수익</p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-[#FFE9D6] shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[#6B7280] text-sm font-medium">일주일 수익</p>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-500" />
          </div>
        </div>
        <p className="text-3xl font-bold mb-1 text-[#281A0E]">
          {isLoading ? "-" : formatCurrency(thisWeek)}
        </p>
        <p className="text-[#6B7280] text-sm">최근 7일</p>
      </div>
    </div>
  );
}
