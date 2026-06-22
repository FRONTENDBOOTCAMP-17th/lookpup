"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Calendar, ChevronLeft, Download } from "lucide-react";
import Header from "@/components/layout/Header";

interface Transaction {
  id: string;
  date: string;
  service: string;
  clientName: string;
  amount: number;
  status: "completed" | "pending";
}

interface EarningsData {
  total: number;
  thisMonth: number;
  thisWeek: number;
  transactions: Transaction[];
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

export default function EarningsPage() {
  const router = useRouter();
  const [data, setData] = useState<EarningsData>({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    transactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/earnings")
      .then((r) => r.json())
      .then(({ data: d }) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">수익 관리</span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
            >
              <ChevronLeft size={20} className="text-[#281A0E]" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[#281A0E]">수익 관리</h2>
              <p className="text-sm text-[#6B7280] mt-1">
                펫시터 활동 수익을 확인하세요
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E8742A] text-sm font-medium text-[#E8742A] bg-white hover:bg-[#FFF8F3] transition-colors">
            <Download size={16} />
            내역 다운로드
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* 이번 달 수익 */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E8742A] to-[#F5A05A] text-white shadow-[0_2px_12px_rgba(232,116,42,0.2)]">
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

          {/* 총 수익 */}
          <div className="p-6 rounded-2xl bg-white border border-[#FFE9D6] shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[#6B7280] text-sm font-medium">총 수익</p>
              <div className="w-10 h-10 rounded-full bg-[#FFF8F3] flex items-center justify-center">
                <TrendingUp size={20} className="text-[#E8742A]" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1 text-[#281A0E]">
              {isLoading ? "-" : formatCurrency(data.total)}
            </p>
            <p className="text-[#6B7280] text-sm">누적 수익</p>
          </div>

          {/* 일주일 수익 */}
          <div className="p-6 rounded-2xl bg-white border border-[#FFE9D6] shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[#6B7280] text-sm font-medium">일주일 수익</p>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1 text-[#281A0E]">
              {isLoading ? "-" : formatCurrency(data.thisWeek)}
            </p>
            <p className="text-[#6B7280] text-sm">최근 7일</p>
          </div>
        </div>

        {/* 월별 수익 차트 영역 */}
        <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 mb-8 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
          <h2 className="text-xl font-bold text-[#281A0E] mb-6">
            월별 수익 현황
          </h2>
          <div className="h-64 bg-[#FFF8F3] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-[#6B7280] mx-auto mb-3" />
              <p className="text-[#6B7280]">차트 영역</p>
              <p className="text-sm text-[#6B7280] mt-1">
                월별 수익 추이를 확인할 수 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* 거래 내역 */}
        <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#281A0E]">거래 내역</h2>
            <button className="hidden md:flex h-9 px-4 rounded-xl border border-[#E8742A] text-sm font-medium text-[#E8742A] hover:bg-[#FFF8F3] transition-colors items-center">
              필터
            </button>
          </div>

          {/* 로딩 / 빈 상태 */}
          {isLoading ? (
            <div className="py-16 text-center text-[#6B7280] text-sm">불러오는 중...</div>
          ) : data.transactions.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280] text-sm">거래 내역이 없습니다.</div>
          ) : (
            <>
              {/* 데스크탑 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#FFE9D6]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">
                        날짜
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">
                        서비스
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">
                        고객명
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">
                        금액
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-[#FFE9D6] hover:bg-[#FFF8F3] transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-[#281A0E]">
                          {transaction.date}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-[#281A0E]">
                          {transaction.service}
                        </td>
                        <td className="py-4 px-4 text-sm text-[#281A0E]">
                          {transaction.clientName}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-right text-[#281A0E]">
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

              {/* 모바일 목록 */}
              <div className="md:hidden space-y-3">
                {data.transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 bg-[#FFF8F3] rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[#281A0E] mb-1">
                          {transaction.service}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {transaction.clientName}
                        </p>
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
                      <p className="text-sm text-[#6B7280]">{transaction.date}</p>
                      <p className="font-bold text-[#E8742A]">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
