"use client";

import type { ServiceRow } from "@/hooks/queries/useSitterDetail";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

const SERVICE_TYPE_UNIT: Record<string, string> = {
  walk: "1시간",
  care: "1일",
  hotel: "1일",
  pickup: "1회",
};

export default function SitterServiceTab({
  services,
}: {
  services: ServiceRow[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
      <h3 className="font-bold text-stone-900 mb-4">제공 서비스 및 가격</h3>
      {services.length === 0 ? (
        <p className="text-gray-400 text-sm">등록된 서비스가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((sv, idx) => {
            const label = SERVICE_TYPE_LABEL[sv.service_type] ?? sv.service_type;
            const unit = SERVICE_TYPE_UNIT[sv.service_type] ?? "1회";
            return (
              <div
                key={idx}
                className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <span className="text-sm font-semibold text-stone-900">
                    {sv.title ?? `${label} (${unit})`}
                  </span>
                  {sv.description && (
                    <p className="text-xs text-gray-500 mt-1">{sv.description}</p>
                  )}
                </div>
                <span className="text-base font-bold text-orange-500 shrink-0">
                  {sv.price.toLocaleString()}원~
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
