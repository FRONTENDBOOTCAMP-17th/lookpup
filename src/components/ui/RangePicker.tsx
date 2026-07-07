"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
  format,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookedRange {
  from: Date;
  to: Date;
}

interface Props {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  bookedRanges?: BookedRange[];
}

function buildWeeks(month: Date): (Date | null)[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const weeks: (Date | null)[][] = [];
  let current = start;
  while (!isAfter(current, end)) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(isSameMonth(current, month) ? current : null);
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RangePicker({ value, onChange, bookedRanges = [] }: Props) {
  const [month, setMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isBookedDay(day: Date): boolean {
    const d = startOfDay(day);
    return bookedRanges.some(
      (r) => !isBefore(d, r.from) && !isAfter(d, r.to),
    );
  }

  function firstBookedInRange(start: Date, end: Date): Date | null {
    let earliest: Date | null = null;
    for (const r of bookedRanges) {
      if (!isAfter(r.from, end) && !isBefore(r.to, start)) {
        const overlapStart = isAfter(r.from, start) ? r.from : start;
        if (!earliest || isBefore(overlapStart, earliest)) {
          earliest = overlapStart;
        }
      }
    }
    return earliest;
  }

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return;
    if (isBookedDay(day)) return;

    if (!value?.from || (value.from && value.to)) {
      onChange({ from: day, to: undefined });
    } else {
      if (isSameDay(day, value.from)) {
        onChange(undefined);
      } else if (isBefore(day, value.from)) {
        const firstBooked = firstBookedInRange(addDays(day, 1), addDays(value.from, -1));
        if (firstBooked) {
          const newTo = addDays(firstBooked, -1);
          onChange({ from: day, to: isBefore(newTo, day) ? undefined : newTo });
        } else {
          onChange({ from: day, to: value.from });
        }
      } else {
        const firstBooked = firstBookedInRange(addDays(value.from, 1), day);
        if (firstBooked) {
          const newTo = addDays(firstBooked, -1);
          if (isSameDay(newTo, value.from) || isBefore(newTo, value.from)) {
            onChange({ from: value.from, to: undefined });
          } else {
            onChange({ from: value.from, to: newTo });
          }
        } else {
          onChange({ from: value.from, to: day });
        }
      }
    }
  }

  function classifyDay(
    day: Date
  ): "start" | "end" | "middle" | "single" | "none" {
    if (!value?.from) return "none";
    const { from, to } = value;
    if (!to || isSameDay(from, to))
      return isSameDay(day, from) ? "single" : "none";
    if (isSameDay(day, from)) return "start";
    if (isSameDay(day, to)) return "end";
    if (isWithinInterval(day, { start: from, end: to })) return "middle";
    return "none";
  }

  const weeks = buildWeeks(month);

  return (
    <div className="select-none bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ffe9d6] hover:bg-[#fff8f3] transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-[#281a0e] text-base font-semibold">
          {format(month, "yyyy년 M월", { locale: ko })}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ffe9d6] hover:bg-[#fff8f3] transition-colors"
        >
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;

              const past = isBefore(day, today);
              const booked = !past && isBookedDay(day);
              const kind = classifyDay(day);
              const isToday = isSameDay(day, today);
              const disabled = past || booked;

              let barClass = "";
              if (kind === "start")
                barClass =
                  "bg-[#ffe9d6]/70 rounded-r-none rounded-l-full left-1/2 right-0";
              else if (kind === "end")
                barClass =
                  "bg-[#ffe9d6]/70 rounded-l-none rounded-r-full left-0 right-1/2";
              else if (kind === "middle")
                barClass = "bg-[#ffe9d6]/70 left-0 right-0";

              const isWeekStart = di === 0;
              const isWeekEnd = di === 6;
              if (kind === "middle" && isWeekStart)
                barClass = "bg-[#ffe9d6]/70 rounded-l-full left-0 right-0";
              if (kind === "middle" && isWeekEnd)
                barClass = "bg-[#ffe9d6]/70 rounded-r-full left-0 right-0";

              return (
                <div
                  key={di}
                  className="relative flex items-center justify-center h-10"
                >
                  {barClass && (
                    <div className={`absolute inset-y-1 ${barClass} z-0`} />
                  )}

                  <button
                    onClick={() => handleDayClick(day)}
                    disabled={disabled}
                    className={[
                      "relative z-10 w-9 h-9 rounded-full text-sm font-medium transition-colors",
                      past ? "text-gray-300 cursor-not-allowed" : "",
                      booked ? "text-gray-300 cursor-not-allowed line-through" : "",
                      !disabled && (kind === "start" || kind === "end" || kind === "single")
                        ? "bg-[var(--color-orange-500)] text-white"
                        : !disabled && kind === "middle"
                          ? "text-[#281a0e] hover:bg-[#fff8f3]"
                          : !disabled && isToday
                            ? "text-[var(--color-orange-500)] font-bold hover:bg-[#fff8f3]"
                            : !disabled
                              ? "text-[#281a0e] hover:bg-[#fff8f3]"
                              : "",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
