"use client";

import { CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { usePortOne } from "@/hooks/usePortOne";

const AMOUNT = 1000;

export default function PayPage() {
  const { status, errorMessage, isPending, requestPayment } = usePortOne();

  const handlePay = () => {
    requestPayment({
      paymentId: `pay_${Date.now()}`,
      orderName: "테스트 결제",
      totalAmount: AMOUNT,
      redirectUrl: `${window.location.origin}/pay/complete`,
      customer: {
        fullName: "테스트",
        phoneNumber: "010-0000-0000",
        email: "test@test.com",
      },
    });
  };

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] overflow-hidden">
        {/* 헤더 */}
        <div className="h-2 bg-linear-to-r from-orange-500 to-orange-300" />

        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-orange-500" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">결제하기</h1>
          </div>

          {/* 결제 정보 */}
          <div className="p-5 bg-orange-50 rounded-xl border border-orange-100 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">상품명</span>
              <span className="text-stone-900 font-medium">테스트 결제</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">결제 수단</span>
              <span className="text-stone-900 font-medium">신용/체크카드</span>
            </div>
            <div className="h-px bg-orange-100" />
            <div className="flex justify-between">
              <span className="text-stone-900 font-bold">결제 금액</span>
              <span className="text-orange-500 text-xl font-bold">
                {AMOUNT.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 결제 결과 */}
          {status === "success" && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <p className="text-green-700 text-sm font-medium">
                결제가 완료되었습니다.
              </p>
            </div>
          )}

          {status === "fail" && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <XCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* 버튼 */}
          <button
            onClick={handlePay}
            disabled={isPending}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-base font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                결제 진행 중...
              </>
            ) : (
              `${AMOUNT.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
