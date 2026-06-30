"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useBookingStore } from "@/store/bookingStore";
import BookingSummary from "./BookingSummary";
import type { Step3Values } from "@/schemas/booking.schema";
import type { Pet } from "@/hooks/queries/usePets";
import type { ServiceKey } from "./BookingClient";

const QUICK_NOTES = ["알러지 있음", "야간 돌봄 필요", "약 복용 중"];
const MAX = 500;

const SERVICES: { key: string; label: string }[] = [
  { key: "visit", label: "방문돌봄" },
  { key: "home", label: "위탁돌봄" },
  { key: "walk", label: "산책" },
  { key: "hotel", label: "펫호텔" },
];

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

export default function StepNotes({
  pets,
  selectedService,
}: {
  pets: Pet[];
  selectedService: ServiceKey | null;
}) {
  const { watch, setValue, formState: { errors } } = useFormContext<Step3Values>();
  const { dateRange, petIds, note, setNote } = useBookingStore();
  const noteValue = watch("note") ?? note;

  function handleNoteChange(val: string) {
    if (val.length <= MAX) {
      setValue("note", val);
      setNote(val);
    }
  }

  function appendQuickNote(quick: string) {
    const next = noteValue ? `${noteValue}\n${quick}` : quick;
    handleNoteChange(next);
  }

  const petNames = petIds
    .map((id) => pets.find((p) => p.id === id)?.name ?? "")
    .filter(Boolean)
    .join(", ") || "-";

  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ?? "-")
    : "-";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-5">
          특이사항을 입력해주세요
        </h2>

        <div className="relative">
          <textarea
            value={noteValue}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder={`펫시터에게 전달할 특이사항을 입력해주세요\n예) 낯선 사람 경계함, 약 복용 필요 등`}
            rows={7}
            className="w-full px-4 py-3 pb-8 bg-white border border-orange-100 rounded-xl text-stone-900 placeholder:text-gray-400 outline-none resize-none focus:border-orange-500 transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-gray-400 text-xs">
            {noteValue.length}/{MAX}
          </span>
        </div>
        {errors.note && (
          <p className="mt-1 text-red-500 text-xs">{errors.note.message}</p>
        )}

        <div className="mt-4">
          <p className="text-stone-900 text-sm font-medium mb-3">자주 선택되는 특이사항</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_NOTES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => appendQuickNote(q)}
                className="min-h-9 px-4 py-1 border border-orange-100 text-gray-500 text-xs font-medium rounded-full hover:border-orange-500/50 hover:text-orange-500 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "날짜", value: formatDateRange(dateRange) },
          { label: "반려동물", value: petNames },
          { label: "서비스", value: serviceLabel },
        ]}
      />
    </div>
  );
}
