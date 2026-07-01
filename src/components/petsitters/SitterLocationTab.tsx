"use client";

import { MapPin } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";

const DEFAULT_LAT = 37.4979;
const DEFAULT_LNG = 127.0276;

export default function SitterLocationTab({
  lat,
  lng,
  sitterId,
  areaText,
}: {
  lat: number | null;
  lng: number | null;
  sitterId: string;
  areaText: string;
}) {
  const mapLat = lat ?? DEFAULT_LAT;
  const mapLng = lng ?? DEFAULT_LNG;

  return (
    <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
      <h3 className="text-stone-900 text-lg font-semibold mb-4">활동 지역</h3>
      <div className="h-100 rounded-xl overflow-hidden">
        <KakaoMap
          markers={[{ lat: mapLat, lng: mapLng, id: sitterId }]}
          center={{ lat: mapLat, lng: mapLng }}
          level={5}
        />
      </div>
      <p className="mt-4 text-gray-500 text-sm flex items-center gap-1">
        <MapPin size={14} className="text-orange-500 shrink-0" />
        {areaText}
      </p>
    </div>
  );
}
