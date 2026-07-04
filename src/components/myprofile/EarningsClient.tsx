"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import Header from "@/components/layout/Header";
import { MobileBackButton, DesktopBackButton } from "@/components/common/BackButton";
import SectionCard from "@/components/common/SectionCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Transaction {
  id: string;
  date: string;
  service: string;
  clientName: string;
  amount: number;
  status: "completed" | "pending";
}

interface MonthlyEarning {
  month: string;
  label: string;
  total: number;
}

interface EarningsData {
  total: number;
  thisMonth: number;
  thisWeek: number;
  monthly: MonthlyEarning[];
  transactions: Transaction[];
}

const chartConfig = {
  total: {
    label: "수익",
    color: "var(--color-orange-500)",
  },
} satisfies ChartConfig;

function formatCurrency(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

export default function EarningsClient({ initialData }: { initialData?: EarningsData | null }) {
  const [data, setData] = useState<EarningsData>(
    initialData ?? { total: 0, thisMonth: 0, thisWeek: 0, monthly: [], transactions: [] },
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    fetch("/api/earnings")
      .then((r) => r.json())
      .then(({ data: d }) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [initialData]);

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
              <h2 className="text-2xl font-bold text-stone-900">수익 관리</h2>
              <p className="text-sm text-gray-500 mt-1">
                펫시터 활동 수익을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-orange-500)] to-[#F5A05A] text-white shadow-[0_2px_12px_rgba(232,116,42,0.2)]">
            <div className="flex items-start justify-between mb-3">
              <p className="text-white/80 text-sm font-medium">이번 달 수익</p>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {isLoading ? "-" : formatCurrency(data.thisMonth)}
            </p>
            <p className="text-white/70 text-sm">
              {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
            </p>
          </div>

          <SectionCard className="p-6 gap-0">
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-500 text-sm font-medium">총 수익</p>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-[var(--color-orange-500)]" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1 text-stone-900">
              {isLoading ? "-" : formatCurrency(data.total)}
            </p>
            <p className="text-gray-500 text-sm">누적 수익</p>
          </SectionCard>

          <SectionCard className="p-6 gap-0">
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-500 text-sm font-medium">일주일 수익</p>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
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
            <div className="h-64 bg-orange-50 rounded-xl flex items-center justify-center">
              <p className="text-gray-500 text-sm">불러오는 중...</p>
            </div>
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

        {/* 거래 내역 */}
        <SectionCard className="p-6 gap-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">거래 내역</h2>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              불러오는 중...
            </div>
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

              <div className="md:hidden space-y-3">
                {data.transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 bg-orange-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-stone-900 mb-1">{transaction.service}</p>
                        <p className="text-sm text-gray-500">{transaction.clientName}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          transaction.status === "completed"
                            ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                            : "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]"
                        }`}
                      >
                        {transaction.status === "completed" ? "정산완료" : "정산예정"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white">
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                      <p className="font-bold text-[var(--color-orange-500)]">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
