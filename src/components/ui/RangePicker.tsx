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
  format,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
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

export default function RangePicker({ value, onChange }: Props) {
  const [month, setMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return;

    if (!value?.from || (value.from && value.to)) {
      onChange({ from: day, to: undefined });
    } else {
      if (isSameDay(day, value.from)) {
        onChange(undefined);
      } else if (isBefore(day, value.from)) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
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
      {/* 월 네비게이션 */}
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

      {/* 요일 헤더 */}
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

      {/* 날짜 그리드 */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;

              const past = isBefore(day, today);
              const kind = classifyDay(day);
              const isToday = isSameDay(day, today);

              // 범위 배경 막대
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
                    disabled={past}
                    className={[
                      "relative z-10 w-9 h-9 rounded-full text-sm font-medium transition-colors",
                      past ? "text-gray-300 cursor-not-allowed" : "cursor-pointer",
                      kind === "start" || kind === "end" || kind === "single"
                        ? "bg-[#e8742a] text-white"
                        : kind === "middle"
                          ? "text-[#281a0e] hover:bg-[#fff8f3]"
                          : isToday
                            ? "text-[#e8742a] font-bold hover:bg-[#fff8f3]"
                            : "text-[#281a0e] hover:bg-[#fff8f3]",
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
