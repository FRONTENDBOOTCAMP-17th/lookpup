"use client";

import { SimpleTimePicker as BaseTimePicker } from "@/components/simple-time-picker";
//캘린더 하단 시간 설정용

export type SimpleTimePickerProps = {
  value: string; // "HH:mm" 24h 형식
  onChange: (value: string) => void;
  placeholder?: string; // 현재 미사용 (기본 컴포넌트가 항상 시간 표시인데 안써도 될듯?)
};

/** "HH:mm" → Date (오늘 날짜 기준) */
function stringToDate(value: string): Date {
  const d = new Date();
  if (!value) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [h, m] = value.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** HH:mm */
function dateToString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function SimpleTimePicker({
  value,
  onChange,
}: SimpleTimePickerProps) {
  return (
    <BaseTimePicker
      value={stringToDate(value)}
      onChange={(date: Date) => onChange(dateToString(date))}
      use12HourFormat
      className="w-full"
    />
  );
}
