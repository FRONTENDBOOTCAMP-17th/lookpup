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
import { MobileBackButton, DesktopBackButton } from "@/components/common/BackButton";
import SectionCard from "@/components/common/SectionCard";
import LoadingPage from "@/components/common/LoadingPage";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 pt-6 md:pt-12 pb-10 md:pb-20">
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
            <p className="text-3xl font-bold mb-1 text-stone-900">
              {isLoading ? "-" : formatCurrency(data.thisWeek)}
            </p>
            <p className="text-gray-500 text-sm">최근 7일</p>
          </SectionCard>
        </div>

        {/* 월별 수익 차트 영역 */}
        <SectionCard className="p-6 mb-8 gap-0">
          <h2 className="text-xl font-bold text-stone-900 mb-6">월별 수익 현황</h2>
          {isLoading ? (
            <LoadingPage className="h-64 bg-orange-50 rounded-xl" />
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={data.monthly} margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} stroke="#ffedd5" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={{ fill: "#fff7ed" }}
                  content={
                    <ChartTooltipContent
                      className="bg-white border-0 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-stone-900 ring-0"
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="total" fill="var(--color-orange-500)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </SectionCard>

        <EarningsSummaryCards
          isLoading={isLoading}
          total={earnings.total}
          thisMonth={earnings.thisMonth}
          thisWeek={earnings.thisWeek}
        />

          {isLoading ? (
            <LoadingPage />
          ) : data.transactions.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              거래 내역이 없습니다.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">날짜</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">서비스</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">고객명</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500">금액</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-orange-100 hover:bg-orange-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-stone-900">{transaction.date}</td>
                        <td className="py-4 px-4 text-sm font-medium text-stone-900">{transaction.service}</td>
                        <td className="py-4 px-4 text-sm text-stone-900">{transaction.clientName}</td>
                        <td className="py-4 px-4 text-sm font-semibold text-right text-stone-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                              transaction.status === "completed"
                                ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                                : "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]"
                            }`}
                          >
                            {transaction.status === "completed" ? "정산완료" : "정산예정"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

        <EarningsTransactions isLoading={isLoading} transactions={earnings.transactions} />
      </div>
    </div>
  );
}
