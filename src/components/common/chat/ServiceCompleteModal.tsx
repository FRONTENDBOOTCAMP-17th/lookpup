"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/useMounted";
import {
  X,
  CheckCircle,
  CalendarDays,
  PawPrint,
  PlayCircle,
} from "lucide-react";

export type ActiveReservation = {
  id: string;
  status: string;
  startDatetime: string | null;
  endDatetime: string | null;
  totalPrice: number;
  serviceTitle: string;
  petName: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "미정";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL_COMPLETE: Record<string, string> = {
  paid: "결제 완료",
  in_progress: "진행 중",
};

const STATUS_LABEL_START: Record<string, string> = {
  accepted: "예약 확정",
  paid: "결제 완료",
};

type Props = {
  open: boolean;
  reservations: ActiveReservation[];
  loading?: boolean;
  sending?: boolean;
  variant?: "complete" | "start";
  onClose: () => void;
  onConfirm: (reservationId: string) => void;
};

export function ServiceCompleteModal({
  open,
  reservations,
  loading = false,
  sending = false,
  variant = "complete",
  onClose,
  onConfirm,
}: Props & { variant?: "complete" | "start" }) {
  const mounted = useMounted();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && reservations.length === 1) {
      setSelectedId(reservations[0].id);
    }
    if (!open) setSelectedId(null);
  }, [open, reservations]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative flex flex-col bg-white rounded-[20px] shadow-[0px_20px_60px_0px_rgba(232,116,42,0.20)] w-[calc(100%-32px)] max-w-[480px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-orange-100 shrink-0">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {variant === "start" ? (
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <PlayCircle size={16} className="text-orange-500" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-[#10B981]" />
              </div>
            )}
            <p className="text-base font-bold text-stone-900">
              {variant === "start"
                ? "서비스 시작 알림 전송"
                : "서비스 완료 전송"}
            </p>
          </div>
          <p className="text-gray-500 text-xs mt-0.5 ml-10">
            {variant === "start"
              ? "시작할 예약을 선택해주세요."
              : "완료할 예약을 선택해주세요."}
          </p>
        </div>

        {/* 안내 */}
        {variant === "start" && (
          <div className="mx-6 mt-4 bg-amber-50 rounded-xl px-4 py-3 text-amber-700 text-xs leading-relaxed shrink-0">
            서비스를 시작해야 돌봄기록을 전송할 수 있습니다.
            <br />
            서비스가 완료되면 반드시{" "}
            <span className="font-semibold">서비스 완료</span>를 꼭 눌러주세요.
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-10 text-center text-sm text-stone-400">
              불러오는 중...
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-stone-400">
                {variant === "start"
                  ? "시작 가능한 예약이 없습니다."
                  : "진행 중인 예약이 없습니다."}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {variant === "start"
                  ? "예약 확정 또는 결제 완료된 예약만 표시됩니다."
                  : "결제 완료 또는 진행 중인 예약만 표시됩니다."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reservations.map((r) => {
                const statusLabel =
                  variant === "start"
                    ? (STATUS_LABEL_START[r.status] ?? r.status)
                    : (STATUS_LABEL_COMPLETE[r.status] ?? r.status);
                const statusClass =
                  r.status === "in_progress"
                    ? "bg-green-100 text-green-700"
                    : r.status === "accepted"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-blue-100 text-blue-700";
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
                      selectedId === r.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-orange-100 bg-white hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-stone-900 flex-1">
                        {r.serviceTitle}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {r.petName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <PawPrint
                          size={11}
                          className="text-orange-400 shrink-0"
                        />
                        <span>{r.petName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <CalendarDays
                        size={11}
                        className="text-orange-400 shrink-0"
                      />
                      <span>
                        {formatDate(r.startDatetime)}
                        {r.endDatetime ? ` ~ ${formatDate(r.endDatetime)}` : ""}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-medium text-orange-500">
                      {r.totalPrice.toLocaleString("ko-KR")}원
                    </div>

                    {selectedId === r.id && (
                      <div className="mt-2 flex items-center gap-1">
                        <CheckCircle size={12} className="text-orange-500" />
                        <span className="text-xs text-orange-500 font-medium">
                          선택됨
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-orange-100 shrink-0" />

        <div className="px-6 py-4 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex-1 h-11 rounded-[10px] bg-white outline outline-offset-[-1px] outline-orange-500 text-orange-500 text-sm font-medium transition-colors hover:bg-orange-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => selectedId && onConfirm(selectedId)}
            disabled={!selectedId || sending || reservations.length === 0}
            className="flex-1 h-11 rounded-[10px] bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? "전송 중..."
              : variant === "start"
                ? "서비스 시작 알림 전송"
                : "서비스 완료 전송"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
