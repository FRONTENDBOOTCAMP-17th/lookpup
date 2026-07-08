"use client";

import { SimpleTimePicker as BaseTimePicker } from "@/components/simple-time-picker";

export type SimpleTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

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
