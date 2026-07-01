import { MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PetsitterCard from "./PetsitterCard";

interface PetsitterListItem {
  id: string;
  name: string;
  initial: string;
  district: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  price: number;
  services: string[];
  distanceKm: number;
}

interface PetsitterListPanelProps {
  listHeading: string;
  sitters: PetsitterListItem[];
  selectedSitterId: string | null;
  onSelectSitter: (id: string) => void;
  onConfirmSitter: (id: string) => void;
  registerCardRef: (id: string, el: HTMLDivElement | null) => void;
  hasAreaFilter: boolean;
  areaLabel: string;
  onClearAreaFilter: () => void;
}

export default function PetsitterListPanel({
  listHeading,
  sitters,
  selectedSitterId,
  onSelectSitter,
  onConfirmSitter,
  registerCardRef,
  hasAreaFilter,
  areaLabel,
  onClearAreaFilter,
}: PetsitterListPanelProps) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 md:p-6">
        <p className="text-stone-900 text-lg font-semibold mb-4">{listHeading}</p>
        <div className="flex flex-col gap-4">
          {sitters.map((sitter) => (
            <div key={sitter.id} ref={(el) => registerCardRef(sitter.id, el)}>
              <PetsitterCard
                sitter={sitter}
                isSelected={selectedSitterId === sitter.id}
                distance={sitter.distanceKm}
                onClick={() => onSelectSitter(sitter.id)}
                onConfirm={() => onConfirmSitter(sitter.id)}
              />
            </div>
          ))}
          {sitters.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
              <MapPin size={32} className="text-orange-200" />
              <p className="text-sm">
                {hasAreaFilter
                  ? `${areaLabel}에 등록된 펫시터가 없어요`
                  : "조건에 맞는 펫시터가 없어요"}
              </p>
              {hasAreaFilter && (
                <button
                  onClick={onClearAreaFilter}
                  className="mt-1 text-orange-500 text-sm font-medium underline underline-offset-2"
                >
                  전체 지역 보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
