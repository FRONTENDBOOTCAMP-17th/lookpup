"use client";

import { MapPin, Star, ChevronRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import { formatDistance } from "@/utils/distance";

interface Sitter {
  id: string;
  name: string;
  initial: string;
  district: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  price: number;
  services: string[];
}

interface PetsitterCardProps {
  sitter: Sitter;
  isSelected: boolean;
  distance: number;
  onClick: () => void;
  onConfirm: () => void;
}

export default function PetsitterCard({
  sitter,
  isSelected,
  distance,
  onClick,
  onConfirm,
}: PetsitterCardProps) {
  return (
    <div onClick={isSelected ? onConfirm : onClick} className="block">
      <div
        className={`w-full p-5 bg-white rounded-2xl border flex flex-col gap-0 transition-all cursor-pointer ${
          isSelected
            ? "border-orange-400 shadow-[0px_4px_20px_0px_rgba(232,116,42,0.28)] ring-2 ring-orange-400"
            : "border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)]"
        }`}
      >
        <div className="flex items-start gap-4">
          <Avatar initial={sitter.initial} size="lg" variant="orange" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-stone-900 text-base font-semibold">{sitter.name}</span>
              {isSelected && (
                <span className="flex items-center gap-0.5 text-orange-500 text-sm font-semibold">
                  예약하기 <ChevronRight size={15} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500 text-sm">
                {sitter.district} {sitter.neighborhood}
              </span>
              <span className="text-gray-400 text-xs">· {formatDistance(distance)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {sitter.services.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-stone-900 text-base font-bold">{sitter.rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({sitter.reviewCount})</span>
          </div>
          <span className="text-orange-500 text-base font-semibold">
            {sitter.price.toLocaleString()}원~
          </span>
        </div>
      </div>
    </div>
  );
}
