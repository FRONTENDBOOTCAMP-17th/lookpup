"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import { usePortOne } from "@/hooks/usePortOne";
import { createPayment } from "@/app/actions/payments";

function formatKRW(value: number) {
  return value.toLocaleString("ko-KR") + "원";
}

function PriceBreakdown({
  amount,
  feeRate,
}: {
  amount: number;
  feeRate: number;
}) {
  const fee = Math.round(amount * feeRate);
  const total = amount + fee;

  return (
    <div className="w-full bg-orange-50 rounded-xl border border-orange-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-orange-100 flex justify-between items-center">
        <span className="text-gray-500 text-sm">예약 금액</span>
        <span className="text-stone-900 text-sm">{formatKRW(amount)}</span>
      </div>
      <div className="px-4 py-3 border-b border-orange-100 flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          서비스 수수료 ({Math.round(feeRate * 100)}%)
        </span>
        <span className="text-stone-900 text-sm">{formatKRW(fee)}</span>
      </div>
      <div className="px-4 py-3.5 bg-white flex justify-between items-center">
        <span className="text-stone-900 text-sm font-bold">총 결제 금액</span>
        <span className="text-orange-500 text-base font-bold">
          {formatKRW(total)}
        </span>
      </div>
    </div>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPending, requestPayment } = usePortOne();

  const reservationId = searchParams.get("reservationId");
  const displayAmount = Number(searchParams.get("amount") ?? 0);
  const feeRate = Number(searchParams.get("fee") ?? 0.05);
  const source = searchParams.get("source") ?? "chat";
  const roomId = searchParams.get("roomId");
  const postId = searchParams.get("postId");
  const sitterName = searchParams.get("sitterName") ?? "펫시터";
  const serviceName = searchParams.get("serviceName") ?? "서비스";

  const [showPayModal, setShowPayModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  function getBackHref() {
    if (source === "chat" && roomId) return `/chat?roomId=${roomId}`;
    if (source === "board" && postId) return `/board/${postId}`;
    return "/";
  }

  const handlePay = async () => {
    if (!reservationId) {
      setPayError("예약 정보가 없습니다.");
      setShowPayModal(false);
      return;
    }

    const result = await createPayment(reservationId, "CARD");
    if (result.error) {
      setPayError(result.error.message);
      setShowPayModal(false);
      return;
    }

    const { payment_id, amount, order_name } = result.data!;

    requestPayment(
      {
        paymentId: payment_id,
        orderName: order_name,
        totalAmount: amount,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl: `${window.location.origin}/payment/complete`,
        customer: {
          fullName: "테스트",
          phoneNumber: "010-0000-0000",
          email: "test@test.com",
        },
      },
      {
        onSuccess: () => {
          setShowPayModal(false);
          setShowSuccessModal(true);
        },
        onFail: () => {
          setShowPayModal(false);
        },
      },
    );
  };

  function handleSuccessConfirm() {
    setShowSuccessModal(false);
    router.push(getBackHref());
  }

  function handleCancelConfirm() {
    setShowCancelModal(false);
    router.push(getBackHref());
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-orange-50 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-200 flex items-center gap-3 mb-6">
          <Link
            href={getBackHref()}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-orange-100 flex items-center justify-center text-stone-900 hover:bg-orange-100 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-stone-900 text-lg sm:text-xl font-bold">
            결제 확인
          </h1>
        </div>

        <div className="w-full max-w-200 bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] overflow-hidden">
          <div className="px-6 sm:px-7 pt-8 pb-6 flex flex-col items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
              <CreditCard
                size={40}
                className="text-orange-500"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-stone-900 text-xl sm:text-3xl font-bold leading-tight">
                결제를 진행하시겠습니까?
              </h2>
              <p className="text-gray-500 text-sm sm:text-base leading-6">
                예약 정보를 확인한 뒤 결제를 진행해 주세요.
              </p>
            </div>
          </div>

          <div className="h-px bg-orange-100" />

          <div className="px-6 sm:px-7 py-5 flex flex-col items-center gap-3">
            <div className="w-full max-w-sm sm:max-w-96 flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="w-9 h-9 bg-white rounded-full border border-orange-100 flex items-center justify-center shrink-0">
                <span className="text-orange-500 text-sm font-semibold">
                  {sitterName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-stone-900 text-sm font-semibold truncate">
                  {sitterName} 펫시터
                </p>
                <p className="text-gray-500 text-xs">{serviceName}</p>
              </div>
            </div>

            <div className="w-full max-w-sm sm:max-w-96">
              <PriceBreakdown amount={displayAmount} feeRate={feeRate} />
            </div>
          </div>

          <div className="h-px bg-orange-100" />

          <div className="px-6 sm:px-7 py-5 flex flex-col items-center gap-3">
            {payError && (
              <p className="text-red-500 text-sm text-center">{payError}</p>
            )}
            <button
              onClick={() => {
                setPayError(null);
                setShowPayModal(true);
              }}
              className="w-full max-w-sm sm:max-w-96 min-h-11 h-11 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] transition-colors"
            >
              결제하기{" "}
              {formatKRW(displayAmount + Math.round(displayAmount * feeRate))}
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full max-w-sm sm:max-w-96 min-h-11 h-11 bg-white border border-orange-500 text-orange-500 text-base font-semibold rounded-[10px] hover:bg-orange-50 transition-colors"
            >
              취소
            </button>
          </div>

          <div className="px-6 sm:px-7 pb-6 text-center">
            <p className="text-gray-400 text-xs leading-5">
              결제 진행 시{" "}
              <span className="text-orange-400 font-medium">이용약관</span> 및{" "}
              <span className="text-orange-400 font-medium">
                개인정보처리방침
              </span>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </main>

      <CustomModal
        open={showPayModal}
        preset="payment"
        onClose={() => !isPending && setShowPayModal(false)}
        onConfirm={handlePay}
        showCloseButton={!isPending}
        closeOnOverlay={!isPending}
        confirmText={isPending ? "결제 중..." : "결제하기"}
      >
        <PriceBreakdown amount={displayAmount} feeRate={feeRate} />
      </CustomModal>

      <CustomModal
        open={showCancelModal}
        preset="cancelReservation"
        title="결제를 취소하시겠습니까?"
        description="결제 페이지를 벗어나면 이전 화면으로 돌아갑니다."
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
      />

      <CustomModal
        open={showSuccessModal}
        preset="success"
        title="결제가 완료되었습니다!"
        description={`${sitterName} 펫시터에게\n예약 알림이 전송되었습니다.`}
        onClose={handleSuccessConfirm}
        onConfirm={handleSuccessConfirm}
        showCloseButton={false}
        closeOnOverlay={false}
      />
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-orange-50 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
