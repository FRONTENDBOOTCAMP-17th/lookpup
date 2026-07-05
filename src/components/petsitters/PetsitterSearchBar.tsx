import { MapPin, LocateFixed, X } from "lucide-react";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import type { LocationSuggestion } from "@/utils/kakaoGeocode";

export const PETSITTER_FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책", "펫호텔"] as const;
export type PetsitterFilter = (typeof PETSITTER_FILTERS)[number];

interface PetsitterSearchBarProps {
  areaQuery: string;
  onAreaQueryChange: (value: string) => void;
  areaSearchRef: React.RefObject<HTMLDivElement | null>;
  showSuggestions: boolean;
  areaSuggestions: LocationSuggestion[];
  onSelectSuggestion: (suggestion: LocationSuggestion) => void;
  onClearAreaFilter: () => void;
  onRequestLocation: () => void;
  activeFilter: PetsitterFilter;
  onFilterChange: (filter: PetsitterFilter) => void;
  hasAreaFilter: boolean;
  areaLabel: string;
}

export default function PetsitterSearchBar({
  areaQuery,
  onAreaQueryChange,
  areaSearchRef,
  showSuggestions,
  areaSuggestions,
  onSelectSuggestion,
  onClearAreaFilter,
  onRequestLocation,
  activeFilter,
  onFilterChange,
  hasAreaFilter,
  areaLabel,
}: PetsitterSearchBarProps) {
  return (
    <div className="p-4 md:p-5 border-b border-orange-100 shrink-0 flex flex-col gap-3">
      <div className="flex gap-2">
        <div ref={areaSearchRef} className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3 md:px-4 py-3 bg-orange-50 rounded-xl">
            <MapPin size={16} className="text-orange-400 shrink-0" />
            <input
              type="text"
              placeholder="지역 또는 펫시터 이름 검색"
              value={areaQuery}
              onChange={(e) => onAreaQueryChange(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm md:text-base text-stone-900 placeholder:text-stone-900/50 outline-none"
            />
            {areaQuery && (
              <button
                onClick={onClearAreaFilter}
                aria-label="지역 검색 초기화"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {showSuggestions && (
            <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-orange-100 rounded-xl shadow-lg overflow-hidden">
              {areaSuggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-orange-50 last:border-0 flex items-center gap-3"
                  >
                    <MapPin size={14} className="text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-900 font-medium truncate">{s.label}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.type === "area" ? s.city : s.address}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onRequestLocation}
          className="shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl bg-orange-50 text-stone-900 hover:bg-orange-100 transition-colors"
          title="내 위치로 지도 이동"
        >
          <LocateFixed className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          <span className="text-sm hidden sm:inline font-medium">내 위치</span>
        </button>
      </div>

      <SearchFilterBar
        filters={PETSITTER_FILTERS}
        activeFilter={activeFilter}
        onFilterChange={(f) => onFilterChange(f as PetsitterFilter)}
        searchQuery=""
        onSearchChange={() => {}}
        hideSearch
        hideSort
      />

      {hasAreaFilter && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-full px-3 py-1 text-sm font-medium">
            <MapPin size={12} />
            <span>{areaLabel}</span>
            <button
              onClick={onClearAreaFilter}
              aria-label="지역 필터 초기화"
              className="ml-0.5 hover:text-orange-800 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
