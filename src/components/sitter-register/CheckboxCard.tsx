"use client";

import { Check } from "lucide-react";

interface CheckboxCardProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export default function CheckboxCard({
  label,
  checked,
  onToggle,
}: CheckboxCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-3 bg-white rounded-lg border border-[#ffe9d6] flex items-center gap-3 hover:border-[var(--color-orange-500)]/50 transition-all text-left"
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)]"
            : "border-gray-300"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
      </div>
      <span className="text-stone-900 text-sm font-normal leading-5">
        {label}
      </span>
    </button>
  );
}
