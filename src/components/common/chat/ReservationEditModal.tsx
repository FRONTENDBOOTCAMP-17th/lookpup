"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, Calendar, Clock } from "lucide-react";
import { createPortal } from "react-dom";
import { DateRange } from "react-day-picker";
import { isSameDay, format } from "date-fns";
import { ko } from "date-fns/locale";
import RangePicker from "@/components/ui/RangePicker";
import { getReservationsByRoom } from "@/app/actions/reservations";

type ReservationItem = {
  id: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  memo?: string | null;
  pets: { id: string; name: string; animal_type: string }[];
};

type ProposedChanges = {
  start_datetime: string;
  end_datetime: string;
  memo?: string | null;
};

type Props = {
  open: boolean;
  roomId: string;
  onClose: () => void;
  onSubmit: (
    reservationId: string,
    proposed: ProposedChanges,
    original: { start_datetime: string; end_datetime: string; memo?: string | null },
  ) => void;
};

type Step = "select" | "edit" | "confirm";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "요청됨", className: "bg-yellow-50 text-yellow-600" },
  accepted: { label: "수락됨", className: "bg-blue-50 text-blue-600" },
  paid: { label: "결제완료", className: "bg-green-50 text-green-600" },
  in_progress: { label: "진행중", className: "bg-orange-50 text-orange-600" },
};

function toTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function fmtDt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRange(from: Date, to: Date | undefined, startTime: string, endTime: string): string {
  const endDate = to ?? from;
  if (isSameDay(from, endDate)) {
    return `${format(from, "yyyy년 M월 d일 (EEE)", { locale: ko })} ${startTime} – ${endTime}`;
  }
  return `${format(from, "M월 d일", { locale: ko })} ${startTime} – ${format(endDate, "M월 d일", { locale: ko })} ${endTime}`;
}

export default function ReservationEditModal({ open, roomId, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReservationItem | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [memo, setMemo] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("select");
    setSelected(null);
    setFetchError(null);
    setLoading(true);
    getReservationsByRoom(roomId).then((result) => {
      setLoading(false);
      if (result.error) {
        setFetchError(result.error.message);
        return;
      }
      setReservations((result.data ?? []) as unknown as ReservationItem[]);
    });
  }, [open, roomId]);

  function handleSelectReservation(r: ReservationItem) {
    setSelected(r);
    const from = new Date(r.start_datetime);
    const to = new Date(r.end_datetime);
    setDateRange({
      from,
      to: isSameDay(from, to) ? undefined : to,
    });
    setStartTime(toTime(r.start_datetime));
    setEndTime(toTime(r.end_datetime));
    setMemo(r.memo ?? "");
    setEditError(null);
    setStep("edit");
  }

  function handleEditNext() {
    if (!dateRange?.from) {
      setEditError("날짜를 선택해주세요.");
      return;
    }
    const endDate = dateRange.to ?? dateRange.from;
    const startDt = buildDateTime(dateRange.from, startTime);
    const endDt = buildDateTime(endDate, endTime);
    if (endDt <= startDt) {
      setEditError("종료 일시는 시작 일시 이후여야 합니다.");
      return;
    }
    setEditError(null);
    setStep("confirm");
  }

  function handleConfirm() {
    if (!selected || !dateRange?.from) return;
    const endDate = dateRange.to ?? dateRange.from;
    onSubmit(
      selected.id,
      {
        start_datetime: buildDateTime(dateRange.from, startTime).toISOString(),
        end_datetime: buildDateTime(endDate, endTime).toISOString(),
        memo: memo.trim() || null,
      },
      {
        start_datetime: selected.start_datetime,
        end_datetime: selected.end_datetime,
        memo: selected.memo,
      },
    );
    onClose();
  }

  if (!open) return null;

  const endDate = dateRange?.to ?? dateRange?.from;
  const proposed: ProposedChanges | null =
    dateRange?.from && endDate
      ? {
          start_datetime: buildDateTime(dateRange.from, startTime).toISOString(),
          end_datetime: buildDateTime(endDate, endTime).toISOString(),
          memo: memo.trim() || null,
        }
      : null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[480px] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 shrink-0">
          <div className="flex items-center gap-1">
            {step !== "select" && (
              <button
                onClick={() => setStep(step === "confirm" ? "edit" : "select")}
                className="p-1 -ml-1 rounded-full hover:bg-orange-50 transition-colors"
              >
                <ChevronLeft size={20} className="text-stone-600" />
              </button>
            )}
            <h2 className="text-base font-semibold text-stone-900">
              {step === "select" && "예약 선택"}
              {step === "edit" && "수정 내용 입력"}
              {step === "confirm" && "변경사항 확인"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-orange-50 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* 단계 표시바 */}
        <div className="flex px-5 py-2 gap-1.5 shrink-0">
          {(["select", "edit", "confirm"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                (step === "select" && i === 0) ||
                (step === "edit" && i <= 1) ||
                step === "confirm"
                  ? "bg-orange-500"
                  : "bg-orange-100"
              }`}
            />
          ))}
        </div>

        {/* Step 1: 예약 선택 */}
        {step === "select" && (
          <div className="px-5 py-4 overflow-y-auto">
            {loading && (
              <p className="text-center text-stone-400 text-sm py-8">불러오는 중...</p>
            )}
            {!loading && fetchError && (
              <p className="text-center text-red-500 text-sm py-8">{fetchError}</p>
            )}
            {!loading && !fetchError && reservations.length === 0 && (
              <p className="text-center text-stone-400 text-sm py-8">
                수정 가능한 예약이 없습니다.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {reservations.map((r) => {
                const statusInfo = STATUS_LABELS[r.status] ?? {
                  label: r.status,
                  className: "bg-stone-50 text-stone-500",
                };
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReservation(r)}
                    className="w-full text-left p-4 border border-orange-100 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-stone-400">
                        {r.pets.map((p) => p.name).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-stone-700">
                      <Calendar size={13} className="text-orange-400 shrink-0" />
                      <span>{fmtDt(r.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-stone-500 mt-0.5">
                      <Clock size={13} className="text-orange-300 shrink-0" />
                      <span>~ {fmtDt(r.end_datetime)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: 수정 내용 입력 */}
        {step === "edit" && selected && (
          <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
            {/* 캘린더 */}
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">날짜 선택</p>
              <RangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* 시간 선택 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                메모
                <span className="text-stone-400 font-normal ml-1">(선택)</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="메모를 입력하세요"
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            {editError && <p className="text-sm text-red-500">{editError}</p>}

            <button
              onClick={handleEditNext}
              className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              다음
            </button>
          </div>
        )}

        {/* Step 3: 변경사항 확인 */}
        {step === "confirm" && selected && proposed && (
          <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
            <p className="text-sm text-stone-500">
              아래 변경사항을 상대방에게 전송합니다. 상대방이 확인하면 예약이 수정됩니다.
            </p>
            <div className="border border-orange-100 rounded-xl overflow-hidden">
              <div className="bg-orange-50 px-4 py-2.5 border-b border-orange-100">
                <p className="text-xs font-semibold text-orange-600">변경사항</p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                <DiffRow
                  label="시작 일시"
                  original={fmtDt(selected.start_datetime)}
                  proposed={fmtDt(proposed.start_datetime)}
                />
                <DiffRow
                  label="종료 일시"
                  original={fmtDt(selected.end_datetime)}
                  proposed={fmtDt(proposed.end_datetime)}
                />
                <DiffRow
                  label="메모"
                  original={selected.memo || "(없음)"}
                  proposed={proposed.memo || "(없음)"}
                />
              </div>
            </div>

            {/* 선택 날짜 요약 */}
            {dateRange?.from && (
              <p className="text-xs text-stone-400 text-center">
                {fmtRange(dateRange.from, dateRange.to, startTime, endTime)}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep("edit")}
                className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                수정하기
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                요청 보내기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function DiffRow({
  label,
  original,
  proposed,
}: {
  label: string;
  original: string;
  proposed: string;
}) {
  const changed = original !== proposed;
  return (
    <div>
      <p className="text-xs text-stone-400 mb-0.5">{label}</p>
      {changed ? (
        <>
          <p className="text-sm text-stone-400 line-through">{original}</p>
          <p className="text-sm text-stone-900 font-medium">{proposed}</p>
        </>
      ) : (
        <p className="text-sm text-stone-600">{original}</p>
      )}
    </div>
  );
}
