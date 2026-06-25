"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreditCard, X, Plus } from "lucide-react";

type RequestType = "extra" | "payment";

interface CostItem {
  id: string;
  name: string;
  amount: string;
  description: string;
}

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
    costItems: CostItem[];
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
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

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
      setCostItems([]);
      setShowAddForm(false);
      setNewItemName("");
      setNewItemAmount("");
      setNewItemDescription("");
    }
  }, [open]);

  if (!open || !mounted) return null;

  const amountNum = Number(amount.replace(/,/g, ""));
  const total = amount && !isNaN(amountNum) && amountNum > 0 ? amountNum : null;

  const displayTotal = total;

  function handleAmountChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    setAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
  }

  function handleNewItemAmountChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    setNewItemAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
  }

  function handleAddCostItem() {
    if (!newItemName.trim() || !newItemAmount) return;
    setCostItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newItemName.trim(),
        amount: newItemAmount,
        description: newItemDescription.trim(),
      },
    ]);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemDescription("");
    setShowAddForm(false);
  }

  function handleRemoveCostItem(id: string) {
    setCostItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSubmit() {
    if (!total || !reason.trim()) return;
    onSubmit?.({ type: requestType, amount: total, reason, costItems });
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
        className="relative w-[calc(100%-32px)] max-w-130 bg-white rounded-[20px] shadow-[0px_20px_60px_0px_rgba(249,115,22,0.30)] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-orange-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-orange-500" />
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
                        ? "bg-orange-100 outline-[1.11px] outline-orange-500"
                        : "bg-white outline-[1.11px] outline-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    <div
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center outline-[1.11px] outline-offset-[-1.11px] transition-colors"
                      style={{ outlineColor: selected ? "#f97316" : "#D1D5DB" }}
                    >
                      {selected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold leading-5 ${selected ? "text-orange-500" : "text-[#281A0E]"}`}
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
                className="w-full h-13.5 pl-4 pr-10 rounded-xl outline outline-orange-200 outline-offset-[-1.11px] text-[15px] text-[#281A0E] placeholder-[rgba(40,26,14,0.50)] focus:outline-orange-500 transition-colors"
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
              className="w-full px-4 py-3.5 rounded-xl outline outline-orange-200 outline-offset-[-1.11px] text-[15px] text-[#281A0E] placeholder-[rgba(40,26,14,0.50)] resize-none focus:outline-orange-500 transition-colors leading-relaxed"
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

            {/* 추가된 항목 목록 */}
            {costItems.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {costItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-orange-50 outline outline-orange-200 outline-offset-[-1px]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#281A0E] truncate">
                          {item.name}
                        </span>
                        <span className="text-sm font-bold text-orange-500 shrink-0">
                          {Number(item.amount.replace(/,/g, "")).toLocaleString("ko-KR")}원
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCostItem(item.id)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-orange-100 transition-colors"
                    >
                      <X size={13} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 항목 추가 폼 */}
            {showAddForm ? (
              <div className="rounded-xl outline outline-orange-300 outline-offset-[-1px] px-4 py-4 flex flex-col gap-3">
                {/* 항목명 */}
                <div>
                  <label className="text-xs font-semibold text-[#281A0E] mb-1.5 block">
                    항목명<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value.slice(0, 30))}
                    placeholder="예) 산책 30분 연장"
                    className="w-full h-11 px-3 rounded-lg outline outline-orange-200 outline-offset-[-1px] text-sm text-[#281A0E] placeholder-[rgba(40,26,14,0.40)] focus:outline-orange-500 transition-colors"
                    autoFocus
                  />
                </div>

                {/* 금액 */}
                <div>
                  <label className="text-xs font-semibold text-[#281A0E] mb-1.5 block">
                    금액<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newItemAmount}
                      onChange={(e) => handleNewItemAmountChange(e.target.value)}
                      placeholder="10,000"
                      className="w-full h-11 pl-3 pr-9 rounded-lg outline outline-orange-200 outline-offset-[-1px] text-sm text-[#281A0E] placeholder-[rgba(40,26,14,0.40)] focus:outline-orange-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                      원
                    </span>
                  </div>
                </div>

                {/* 상세 설명 */}
                <div>
                  <label className="text-xs font-semibold text-[#281A0E] mb-1.5 block">
                    상세 설명
                    <span className="text-[#9CA3AF] font-normal ml-1">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value.slice(0, 60))}
                    placeholder="예) 보호자 요청으로 공원 1바퀴 추가"
                    className="w-full h-11 px-3 rounded-lg outline outline-orange-200 outline-offset-[-1px] text-sm text-[#281A0E] placeholder-[rgba(40,26,14,0.40)] focus:outline-orange-500 transition-colors"
                  />
                </div>

                {/* 폼 버튼 */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItemName("");
                      setNewItemAmount("");
                      setNewItemDescription("");
                    }}
                    className="flex-1 h-9 rounded-lg border border-orange-200 text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCostItem}
                    disabled={!newItemName.trim() || !newItemAmount}
                    className="flex-1 h-9 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-default"
                  >
                    추가
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full h-10.5 rounded-xl outline outline-orange-200 outline-offset-[-1.11px] flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Plus size={15} className="text-orange-500" />
                <span className="text-orange-500 text-sm font-medium">
                  항목 추가
                </span>
              </button>
            )}
          </div>

          {/* 총 요청 금액 */}
          <div className="bg-orange-50 rounded-2xl border border-orange-200 px-5 py-5 flex items-center justify-between">
            <span className="text-orange-900 text-sm font-semibold">
              총 요청 금액
            </span>
            <span className="text-orange-500 text-2xl font-bold">
              {displayTotal ? displayTotal.toLocaleString("ko-KR") + "원" : "—"}
            </span>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 pt-4 pb-6 border-t border-orange-200 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-13 rounded-xl border border-orange-200 text-orange-500 text-[15px] font-semibold hover:bg-orange-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!total || !reason.trim()}
            className="flex-1 h-13 rounded-xl bg-orange-500 flex items-center justify-center gap-2 text-white text-[15px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-default"
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
