"use client";

import { useFormContext } from "react-hook-form";
import { Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useBookingStore } from "@/store/bookingStore";
import RangePicker from "@/components/ui/RangePicker";
import SimpleTimePicker from "@/components/ui/SimpleTimePicker";
import BookingSummary from "./BookingSummary";
import type { Step1Values } from "@/schemas/booking.schema";
import type { SitterBookingInfo } from "@/hooks/queries/useSitterBookingInfo";

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

function formatTime12h(value: string): string {
  if (!value) return "--:--";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "오후" : "오전";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function StepDateSelect({
  sitter,
  bookedRanges,
}: {
  sitter: SitterBookingInfo;
  bookedRanges: { from: Date; to: Date }[];
}) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<Step1Values>();
  const { dateRange, setDateRange } = useBookingStore();
  const startTime = watch("startTime") ?? "";
  const endTime = watch("endTime") ?? "";

  const nights = dateRange?.from && dateRange?.to
    ? Math.max(1, differenceInDays(dateRange.to, dateRange.from))
    : 1;

  function handleDateChange(range: DateRange | undefined) {
    setDateRange(range);
    setValue("dateRange", range as Step1Values["dateRange"]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-5">
          날짜를 선택해주세요
        </h2>

        <div className="overflow-x-auto">
          <RangePicker value={dateRange} onChange={handleDateChange} bookedRanges={bookedRanges} />
        </div>

        {errors.dateRange && (
          <p className="mt-2 text-red-500 text-xs">{errors.dateRange.from?.message}</p>
        )}

        {dateRange?.from && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-orange-500 shrink-0" />
              <span className="text-orange-500 text-sm sm:text-base font-semibold">
                {formatDateRange(dateRange)}
              </span>
              {nights > 1 && (
                <span className="ml-auto text-orange-500 text-sm font-medium shrink-0">
                  {nights}일
                </span>
              )}
            </div>
            {(startTime || endTime) && (
              <div className="flex items-center gap-1.5 pl-6 text-sm text-gray-500">
                <span>시간</span>
                <span className="text-stone-900 font-medium">
                  {startTime ? formatTime12h(startTime) : "--:--"}
                </span>
                <span>~</span>
                <span className="text-stone-900 font-medium">
                  {endTime ? formatTime12h(endTime) : "--:--"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-900">시작 시간</label>
            <SimpleTimePicker
              value={startTime}
              onChange={(v) => setValue("startTime", v, { shouldValidate: true })}
            />
            {errors.startTime && (
              <p className="text-red-500 text-xs">{errors.startTime.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-900">종료 시간</label>
            <SimpleTimePicker
              value={endTime}
              onChange={(v) => setValue("endTime", v, { shouldValidate: true })}
            />
            {errors.endTime && (
              <p className="text-red-500 text-xs">{errors.endTime.message}</p>
            )}
          </div>
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "펫시터", value: sitter.name },
        ]}
      />
    </div>
  );
}
