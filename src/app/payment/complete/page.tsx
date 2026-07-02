"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type PaymentStatus = "loading" | "success" | "fail";

function PayCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code");
  const paymentId = searchParams.get("paymentId");
  const message = searchParams.get("message");

  const status = (code || !paymentId ? "fail" : "success") as PaymentStatus;

  const errorMessage = code
    ? (message ?? "결제에 실패했습니다.")
    : !paymentId
      ? "결제 정보를 찾을 수 없습니다."
      : null;

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] overflow-hidden">
        <div className="h-2 bg-linear-to-r from-orange-500 to-orange-300" />

        <div className="p-8 flex flex-col items-center gap-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 size={48} className="text-orange-500 animate-spin" />
              <p className="text-stone-900 font-medium">결제 확인 중...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle size={48} className="text-green-500" />
              <div>
                <h1 className="text-xl font-bold text-stone-900">결제 완료</h1>
                <p className="mt-1 text-gray-500 text-sm">
                  결제가 성공적으로 완료되었습니다.
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                Home으로 돌아가기
              </button>
            </>
          )}

          {status === "fail" && (
            <>
              <XCircle size={48} className="text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-stone-900">결제 실패</h1>
                <p className="mt-1 text-gray-500 text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => router.back()}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                다시 시도하기
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PayCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-orange-50 flex items-center justify-center p-5">
          <Loader2 size={48} className="text-orange-500 animate-spin" />
        </main>
      }
    >
      <PayCompleteContent />
    </Suspense>
  );
}
