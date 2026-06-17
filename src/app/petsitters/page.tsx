"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Star, LocateFixed } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import KakaoMap from "@/components/KakaoMap";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import { calculateDistanceKm, formatDistance } from "@/utils/distance";
import { searchPlaceToCoord, coordToRegion } from "@/utils/kakaoGeocode";
import { supabase } from "@/lib/supabase";

const FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책"] as const;
type Filter = (typeof FILTERS)[number];

const SORT_OPTIONS = [
  "평점순",
  "리뷰 많은 순",
  "낮은 가격순",
  "높은 가격순",
] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SERVICE_TYPE_MAP: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

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
  lat: number;
  lng: number;
}

function parseArea(area: string | null): { district: string; neighborhood: string } {
  if (!area) return { district: "", neighborhood: "" };
  const cleaned = area.replace(/^서울\s*/, "").replace(/,.*$/, "").trim();
  const parts = cleaned.split(/\s+/);
  return { district: parts[0] ?? "", neighborhood: parts[1] ?? "" };
}

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

interface PetsitterCardProps {
  sitter: Sitter;
  isSelected: boolean;
  distance: number;
}

function PetsitterCard({ sitter, isSelected, distance }: PetsitterCardProps) {
  return (
    <Link href={`/petsitters/${sitter.id}`} className="block">
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
              <span className="text-stone-900 text-base font-semibold">
                {sitter.name}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500 text-sm">
                {sitter.district} {sitter.neighborhood}
              </span>
              <span className="text-gray-400 text-xs">
                · {formatDistance(distance)}
              </span>
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
            <span className="text-stone-900 text-base font-bold">
              {sitter.rating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">
              ({sitter.reviewCount})
            </span>
          </div>
          <span className="text-orange-500 text-base font-semibold">
            {sitter.price.toLocaleString()}원~
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PetsittersPage() {
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSitterId, setSelectedSitterId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);

  const [basePosition, setBasePosition] = useState(DEFAULT_CENTER);
  const [baseLabel, setBaseLabel] = useState("강남역");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    type SitterRow = {
      id: string;
      available_area: string | null;
      latitude: number | null;
      longitude: number | null;
      base_price: number | null;
      rating: number | null;
      full_name: string | null;
      service_types: string[];
    };

    async function fetchSitters() {
      const { data, error } = await supabase.rpc("get_petsitters_for_map");

      if (error || !data) return;

      const mapped: Sitter[] = (data as SitterRow[])
        .filter((row) => row.latitude != null && row.longitude != null)
        .map((row) => {
          const name = row.full_name ?? "시터";
          const { district, neighborhood } = parseArea(row.available_area);
          const serviceTypes = row.service_types
            .map((t) => SERVICE_TYPE_MAP[t] ?? t)
            .filter(Boolean);

          return {
            id: row.id,
            name,
            initial: name.charAt(0),
            district,
            neighborhood,
            rating: parseFloat(String(row.rating ?? 0)),
            reviewCount: 0,
            price: row.base_price ?? 0,
            services: [...new Set(serviceTypes)],
            lat: parseFloat(String(row.latitude)),
            lng: parseFloat(String(row.longitude)),
          };
        });

      setSitters(mapped);
    }

    fetchSitters();
  }, []);

  // 카드 스크롤 동기화
  useEffect(() => {
    if (selectedSitterId === null) return;
    const card = cardRefs.current.get(selectedSitterId);
    if (!card) return;

    const viewport = card.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    viewport.scrollTo({
      top: viewport.scrollTop + cardRect.top - viewportRect.top - 20,
      behavior: "smooth",
    });
  }, [selectedSitterId]);

  // 검색어로 장소 검색 → 지도 중심 이동 (500ms debounce)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      searchPlaceToCoord(q).then((result) => {
        if (result) {
          setBasePosition({ lat: result.lat, lng: result.lng });
          setBaseLabel(result.addressName);
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function requestLocation() {
    setLocationLoading(true);
    setShowLocationModal(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setBasePosition(pos);
        setBaseLabel("현재 위치");
        const region = await coordToRegion(pos.lat, pos.lng);
        if (region) {
          setBaseLabel(`현재 위치 (${region.dong || region.sigungu})`);
        }
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
    );
  }

  const sittersWithDistance = sitters.map((sitter) => ({
    ...sitter,
    distanceKm: calculateDistanceKm(basePosition, {
      lat: sitter.lat,
      lng: sitter.lng,
    }),
  }));

  const filtered = sittersWithDistance
    .filter((s) => {
      const matchFilter =
        activeFilter === "전체" ? true : s.services.includes(activeFilter);
      const matchSearch =
        searchQuery === "" ||
        s.name.includes(searchQuery) ||
        s.district.includes(searchQuery) ||
        s.neighborhood.includes(searchQuery);
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "평점순") return b.rating - a.rating;
      if (sortBy === "리뷰 많은 순") return b.reviewCount - a.reviewCount;
      if (sortBy === "낮은 가격순") return a.price - b.price;
      if (sortBy === "높은 가격순") return b.price - a.price;
      return a.distanceKm - b.distanceKm;
    });

  return (
    <>
      <Header />

      {/* 위치 동의 모달 */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <LocateFixed size={20} className="text-orange-500" />
              </div>
              <h2 className="text-stone-900 text-lg font-semibold">
                현재 위치 사용
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              현재 위치를 사용하면 가까운 펫시터를 찾을 수 있어요!
              <br />
              위치 정보는 펫시터 거리 계산에만 사용됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
              >
                나중에
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium"
              >
                동의하기
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-orange-50 overflow-x-hidden md:overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
          {/* 지도 영역 */}
          <div className="h-[40vh] md:h-full md:flex-1 relative overflow-hidden">
            {locationLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow text-sm text-orange-500 font-medium">
                위치 확인 중...
              </div>
            )}
            <KakaoMap
              markers={filtered.map(
                ({ lat, lng, id, name, district, neighborhood, distanceKm }) => ({
                  lat,
                  lng,
                  id,
                  name,
                  district,
                  neighborhood,
                  distanceKm,
                }),
              )}
              center={basePosition}
              basePosition={basePosition}
              level={7}
              selectedMarkerId={selectedSitterId}
              onMarkerClick={(id) => setSelectedSitterId(String(id))}
            />
          </div>

          {/* 리스트 패널 */}
          <div className="w-full md:w-153.5 bg-white flex flex-col md:overflow-hidden">
            <div className="p-4 md:p-6 border-b border-orange-100 shrink-0">
              <SearchFilterBar
                placeholder="지역, 동 이름, 펫시터 검색"
                filters={FILTERS}
                activeFilter={activeFilter}
                onFilterChange={(f) => setActiveFilter(f as Filter)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOptions={SORT_OPTIONS}
                sortBy={sortBy}
                onSortChange={(v) => setSortBy(v as SortOption)}
              />
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 md:p-6">
                <p className="text-stone-900 text-lg font-semibold mb-4">
                  {sortBy
                    ? `${sortBy} · ${filtered.length}명`
                    : `${baseLabel} 기준 가까운 순 · ${filtered.length}명`}
                </p>
                <div className="flex flex-col gap-4">
                  {filtered.map((sitter) => (
                    <div
                      key={sitter.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(sitter.id, el);
                        else cardRefs.current.delete(sitter.id);
                      }}
                    >
                      <PetsitterCard
                        sitter={sitter}
                        isSelected={selectedSitterId === sitter.id}
                        distance={sitter.distanceKm}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </>
  );
}
