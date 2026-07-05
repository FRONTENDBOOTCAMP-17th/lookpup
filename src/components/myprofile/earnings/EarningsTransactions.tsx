import { formatEarningsCurrency as formatCurrency } from "@/utils/earnings";
import type { Transaction } from "@/types/earnings";

function statusBadgeClass(status: Transaction["status"]) {
  return status === "completed"
    ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
    : "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]";
}

function statusLabel(status: Transaction["status"]) {
  return status === "completed" ? "정산완료" : "정산예정";
}

interface EarningsTransactionsProps {
  isLoading: boolean;
  transactions: Transaction[];
}

export default function EarningsTransactions({
  isLoading,
  transactions,
}: EarningsTransactionsProps) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#281A0E]">거래 내역</h2>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-[#6B7280] text-sm">불러오는 중...</div>
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center text-[#6B7280] text-sm">거래 내역이 없습니다.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#FFE9D6]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">날짜</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">서비스</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">고객명</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">금액</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]">상태</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[#FFE9D6] hover:bg-[#FFF8F3] transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-[#281A0E]">{transaction.date}</td>
                    <td className="py-4 px-4 text-sm font-medium text-[#281A0E]">
                      {transaction.service}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#281A0E]">{transaction.clientName}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-right text-[#281A0E]">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${statusBadgeClass(transaction.status)}`}
                      >
                        {statusLabel(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 bg-[#FFF8F3] rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#281A0E] mb-1">{transaction.service}</p>
                    <p className="text-sm text-[#6B7280]">{transaction.clientName}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadgeClass(transaction.status)}`}
                  >
                    {statusLabel(transaction.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white">
                  <p className="text-sm text-[#6B7280]">{transaction.date}</p>
                  <p className="font-bold text-[var(--color-orange-500)]">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
