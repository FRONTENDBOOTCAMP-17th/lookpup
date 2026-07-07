"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/useMounted";
import { X, CalendarDays, MapPin, PawPrint, Wrench, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_LABEL: Record<string, string> = {
  visit: "방문 돌봄",
  walk: "산책",
  sitting: "위탁 돌봄",
};

export type ReservationDetails = {
  title: string;
  startDatetime: string | null;
  endDatetime: string | null;
  requestType: string | null;
  location: string | null;
  totalPrice: number | null;
  petName: string | null;
  petAnimalType: string | null;
  petBreed: string | null;
};

type ReservationOverrides = {
  startDatetime: string | null;
  endDatetime: string | null;
  totalPrice: number | null;
  location: string | null;
};

type Props = {
  open: boolean;
  sitterName: string;
  details: ReservationDetails | null;
  loading?: boolean;
  confirming?: boolean;
  hideEdit?: boolean;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (overrides: ReservationOverrides) => void;
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(iso: string | null): string {
  if (!iso) return "미정";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RowView({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-orange-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-stone-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function RowEdit({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-orange-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

export function ReservationConfirmModal({
  open,
  sitterName,
  details,
  loading = false,
  confirming = false,
  hideEdit = false,
  confirmLabel = "예약 확정",
  onClose,
  onConfirm,
}: Props) {
  const mounted = useMounted();
  const [editMode, setEditMode] = useState(false);

  const [startDt, setStartDt] = useState("");
  const [endDt, setEndDt] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [snapshot, setSnapshot] = useState({ startDt: "", endDt: "", price: "", location: "" });

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevDetails, setPrevDetails] = useState(details);
  if (open !== prevOpen || details !== prevDetails) {
    setPrevOpen(open);
    setPrevDetails(details);
    if (details && open) {
      setStartDt(toDatetimeLocal(details.startDatetime));
      setEndDt(toDatetimeLocal(details.endDatetime));
      setPrice(details.totalPrice != null ? String(details.totalPrice) : "");
      setLocation(details.location ?? "");
      setEditMode(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !mounted) return null;

  function buildOverrides(): ReservationOverrides {
    return {
      startDatetime: startDt ? new Date(startDt).toISOString() : null,
      endDatetime: endDt ? new Date(endDt).toISOString() : null,
      totalPrice: price !== "" ? Number(price) : null,
      location: location.trim() || null,
    };
  }

  const petLabel = details?.petName
    ? `${details.petName}${details.petAnimalType ? ` (${details.petAnimalType}${details.petBreed ? ` · ${details.petBreed}` : ""})` : ""}`
    : "없음";

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
        <div className="px-6 pt-6 pb-4 border-b border-orange-100 shrink-0">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-base font-bold text-stone-900">예약 내용 확인</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-orange-500 font-medium">{sitterName}</span> 님과의 예약 내용을 확인해주세요
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-stone-400">불러오는 중...</div>
          ) : !details ? (
            <div className="py-10 text-center text-sm text-red-400">정보를 불러오지 못했습니다.</div>
          ) : editMode ? (
            <>
              <RowEdit
                label="시작 일시"
                icon={<CalendarDays size={16} className="text-orange-400" />}
              >
                <input
                  type="datetime-local"
                  value={startDt}
                  onChange={(e) => setStartDt(e.target.value)}
                  className="w-full text-sm text-stone-900 border border-orange-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
                />
              </RowEdit>
              <RowEdit
                label="종료 일시"
                icon={<CalendarDays size={16} className="text-orange-400" />}
              >
                <input
                  type="datetime-local"
                  value={endDt}
                  onChange={(e) => setEndDt(e.target.value)}
                  className="w-full text-sm text-stone-900 border border-orange-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
                />
              </RowEdit>
              <RowEdit
                label="위치"
                icon={<MapPin size={16} className="text-orange-400" />}
              >
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="위치를 입력하세요"
                  className="w-full text-sm text-stone-900 border border-orange-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
                />
              </RowEdit>
              <RowEdit
                label="금액"
                icon={<CircleDollarSign size={16} className="text-orange-400" />}
              >
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="flex-1 text-sm text-stone-900 border border-orange-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
                  />
                  <span className="text-sm text-gray-400 shrink-0">원</span>
                </div>
              </RowEdit>
            </>
          ) : (
            <>
              <RowView
                label="구인글 제목"
                icon={<ClipboardListIcon />}
                value={details.title}
              />
              <RowView
                label="서비스 종류"
                icon={<Wrench size={16} className="text-orange-400" />}
                value={SERVICE_LABEL[details.requestType ?? ""] ?? details.requestType ?? "미정"}
              />
              <RowView
                label="반려동물"
                icon={<PawPrint size={16} className="text-orange-400" />}
                value={petLabel}
              />
              <RowView
                label="시작 일시"
                icon={<CalendarDays size={16} className="text-orange-400" />}
                value={formatDisplay(startDt ? new Date(startDt).toISOString() : details.startDatetime)}
              />
              <RowView
                label="종료 일시"
                icon={<CalendarDays size={16} className="text-orange-400" />}
                value={formatDisplay(endDt ? new Date(endDt).toISOString() : details.endDatetime)}
              />
              <RowView
                label="위치"
                icon={<MapPin size={16} className="text-orange-400" />}
                value={location || details.location || "미정"}
              />
              <RowView
                label="금액"
                icon={<CircleDollarSign size={16} className="text-orange-400" />}
                value={
                  (price !== "" ? Number(price) : details.totalPrice) != null
                    ? `${((price !== "" ? Number(price) : details.totalPrice) ?? 0).toLocaleString()}원`
                    : "미정"
                }
              />
            </>
          )}
        </div>

        <div className="h-px bg-orange-100 shrink-0" />

        <div className="px-6 py-4 flex gap-3 shrink-0">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setStartDt(snapshot.startDt);
                  setEndDt(snapshot.endDt);
                  setPrice(snapshot.price);
                  setLocation(snapshot.location);
                  setEditMode(false);
                }}
                className="flex-1 h-11 rounded-[10px] bg-white outline outline-1 outline-offset-[-1px] outline-orange-500 text-orange-500 text-sm font-medium transition-colors hover:bg-orange-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 h-11 rounded-[10px] bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                저장
              </button>
            </>
          ) : (
            <>
              {!hideEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setSnapshot({ startDt, endDt, price, location });
                    setEditMode(true);
                  }}
                  disabled={!details || confirming}
                  className={cn(
                    "flex-1 h-11 rounded-[10px] bg-white outline outline-1 outline-offset-[-1px] outline-orange-500 text-orange-500 text-sm font-medium transition-colors hover:bg-orange-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  수정
                </button>
              )}
              <button
                type="button"
                onClick={() => onConfirm(buildOverrides())}
                disabled={!details || confirming}
                className={cn(
                  "flex-1 h-11 rounded-[10px] bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {confirming ? "처리 중..." : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function ClipboardListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}
