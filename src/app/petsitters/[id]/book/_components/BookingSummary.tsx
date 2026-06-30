"use client";

export default function BookingSummary({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-orange-100">
      <p className="text-stone-900 text-base font-semibold mb-3">예약 요약</p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">{r.label}</span>
            <span className="text-stone-900 font-medium text-right">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
