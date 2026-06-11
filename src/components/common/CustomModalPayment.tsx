"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreditCard, X, Plus } from "lucide-react";

type RequestType = "extra" | "payment";

const REQUEST_TYPES: { value: RequestType; label: string; sub: string }[] = [
  { value: "extra", label: "추가금 요청", sub: "추가 서비스 발생 시" },
  { value: "payment", label: "결제 요청", sub: "예약 연장 등" },
];

interface CustomModalPaymentProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    type: RequestType;
    amount: number;
    reason: string;
  }) => void;
}

export function CustomModalPayment({
  open,
  onClose,
  onSubmit,
}: CustomModalPaymentProps) {
  const [mounted, setMounted] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("extra");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setRequestType("extra");
      setAmount("");
      setReason("");
    }
  }, [open]);

  if (!open || !mounted) return null;

  const amountNum = Number(amount.replace(/,/g, ""));
  const total = amount && !isNaN(amountNum) && amountNum > 0 ? amountNum : null;

  function handleAmountChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    setAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
  }

  function handleSubmit() {
    if (!total || !reason.trim()) return;
    onSubmit?.({ type: requestType, amount: total, reason });
    onClose();
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[calc(100%-32px)] max-w-130 bg-white rounded-[20px] shadow-[0px_20px_60px_0px_rgba(232,116,42,0.20)] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-[#FFE9D6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FFF0E8] rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-[#E8742A]" />
            </div>
            <div>
              <p className="text-[#281A0E] text-lg font-bold leading-[22.5px]">
                결제 요청
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                추가 서비스 또는 예약 연장 비용을 요청합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* 요청 유형 */}
          <div>
            <p className="text-[#281A0E] text-sm font-semibold mb-3">
              요청 유형
            </p>
            <div className="flex gap-3">
              {REQUEST_TYPES.map(({ value, label, sub }) => {
                const selected = requestType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRequestType(value)}
                    className={`flex-1 p-4 rounded-xl flex items-start gap-3 text-left transition-colors ${
                      selected
                        ? "bg-[#FFF0E8] outline-[1.11px] outline-[#E8742A]"
                        : "bg-white outline-[1.11px] outline-[#FFE9D6] hover:bg-orange-50"
                    }`}
                  >
                    <div
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center outline-[1.11px] outline-offset-[-1.11px] transition-colors"
                      style={{ outlineColor: selected ? "#E8742A" : "#D1D5DB" }}
                    >
                      {selected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E8742A]" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold leading-5 ${selected ? "text-[#E8742A]" : "text-[#281A0E]"}`}
                      >
                        {label}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 요청 금액 */}
          <div>
            <p className="text-[#281A0E] text-sm font-semibold mb-2">
              요청 금액<span className="text-red-500">*</span>
            </p>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="20,000"
                className="w-full h-13.5 pl-4 pr-10 rounded-xl outline outline-[#FFE9D6] outline-offset-[-1.11px] text-[15px] text-[#281A0E] placeholder-[rgba(40,26,14,0.50)] focus:outline-[#E8742A] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                원
              </span>
            </div>
            <p className="text-[#9CA3AF] text-xs mt-1.5">
              최소 1,000원 · 최대 500,000원
            </p>
          </div>

          {/* 요청 사유 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#281A0E] text-sm font-semibold">
                요청 사유<span className="text-red-500">*</span>
              </p>
              <span className="text-[#9CA3AF] text-xs">
                {reason.length} / 300
              </span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 300))}
              placeholder={
                "추가 비용이 발생한 이유를 작성해주세요.\n예) 산책 시간 연장 30분\n예) 추가 목욕 서비스 제공"
              }
              rows={4}
              className="w-full px-4 py-3.5 rounded-xl outline outline-[#FFE9D6] outline-offset-[-1.11px] text-[15px] text-[#281A0E] placeholder-[rgba(40,26,14,0.50)] resize-none focus:outline-[#E8742A] transition-colors leading-relaxed"
            />
          </div>

          {/* 비용 상세 내역 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#281A0E] text-sm font-semibold">
                비용 상세 내역
              </p>
              <span className="text-[#9CA3AF] text-xs">선택사항</span>
            </div>
            <button
              type="button"
              className="w-full h-10.5 rounded-xl outline outline-[#FFE9D6] outline-offset-[-1.11px] flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
            >
              <Plus size={15} className="text-[#E8742A]" />
              <span className="text-[#E8742A] text-sm font-medium">
                항목 추가
              </span>
            </button>
          </div>

          {/* 총 요청 금액 */}
          <div className="bg-[#FFF8F3] rounded-2xl outline outline-[#FFE9D6] outline-offset-[-1.11px] px-5 py-5 flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold">
              총 요청 금액
            </span>
            <span className="text-[#E8742A] text-2xl font-bold">
              {total ? total.toLocaleString("ko-KR") + "원" : "—"}
            </span>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 pt-4 pb-6 border-t border-[#FFE9D6] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-13 rounded-xl outline outline-[#FFE9D6] outline-offset-[-1.11px] text-gray-500 text-[15px] font-semibold hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!total || !reason.trim()}
            className="flex-1 h-13 rounded-xl bg-[#E8742A] flex items-center justify-center gap-2 text-white text-[15px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            <CreditCard size={17} className="text-white" />
            결제 요청 보내기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
