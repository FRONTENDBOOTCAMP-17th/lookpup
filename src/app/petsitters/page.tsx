"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import KakaoMap from "@/components/KakaoMap";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchFilterBar from "@/components/common/SearchFilterBar";

const FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책", "인증만"] as const;
type Filter = (typeof FILTERS)[number];

const SORT_OPTIONS = [
  "평점순",
  "리뷰 많은 순",
  "낮은 가격순",
  "높은 가격순",
] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

//더미더미데이터 강남 중심으로 바꿔봄
const PETSITTERS = [
  {
    id: 1,
    name: "김민지",
    initial: "김",
    district: "강남구",
    neighborhood: "역삼동",
    rating: 4.9,
    reviewCount: 47,
    price: 30000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.5006,
    lng: 127.0364,
  },
  {
    id: 2,
    name: "이서연",
    initial: "이",
    district: "강남구",
    neighborhood: "삼성동",
    rating: 4.8,
    reviewCount: 32,
    price: 35000,
    services: ["방문돌봄", "위탁돌봄"],
    certified: false,
    lat: 37.5146,
    lng: 127.0565,
  },
  {
    id: 3,
    name: "박준호",
    initial: "박",
    district: "강남구",
    neighborhood: "논현동",
    rating: 4.7,
    reviewCount: 28,
    price: 28000,
    services: ["산책", "방문돌봄"],
    certified: false,
    lat: 37.5112,
    lng: 127.0218,
  },
  {
    id: 4,
    name: "최예진",
    initial: "최",
    district: "서초구",
    neighborhood: "서초동",
    rating: 4.6,
    reviewCount: 15,
    price: 32000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.4901,
    lng: 127.0175,
  },
  {
    id: 5,
    name: "정수아",
    initial: "정",
    district: "서초구",
    neighborhood: "반포동",
    rating: 4.5,
    reviewCount: 52,
    price: 38000,
    services: ["위탁돌봄", "방문돌봄"],
    certified: false,
    lat: 37.5046,
    lng: 126.9947,
  },
  {
    id: 6,
    name: "강태윤",
    initial: "강",
    district: "서초구",
    neighborhood: "양재동",
    rating: 4.9,
    reviewCount: 38,
    price: 25000,
    services: ["산책", "방문돌봄"],
    certified: false,
    lat: 37.4847,
    lng: 127.0344,
  },
  {
    id: 7,
    name: "윤지우",
    initial: "윤",
    district: "송파구",
    neighborhood: "잠실동",
    rating: 4.8,
    reviewCount: 41,
    price: 33000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.5133,
    lng: 127.1002,
  },
  {
    id: 8,
    name: "한소미",
    initial: "한",
    district: "송파구",
    neighborhood: "문정동",
    rating: 4.7,
    reviewCount: 23,
    price: 29000,
    services: ["위탁돌봄", "산책"],
    certified: false,
    lat: 37.4854,
    lng: 127.1225,
  },
  {
    id: 9,
    name: "오하린",
    initial: "오",
    district: "송파구",
    neighborhood: "방이동",
    rating: 4.9,
    reviewCount: 36,
    price: 34000,
    services: ["방문돌봄", "위탁돌봄", "산책"],
    certified: true,
    lat: 37.5141,
    lng: 127.1128,
  },
];

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

interface PetsitterCardProps {
  sitter: (typeof PETSITTERS)[number];
  isSelected: boolean;
  distance?: number;
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
        {/* 프로필 행 */}
        <div className="flex items-start gap-4">
          <Avatar initial={sitter.initial} size="lg" variant="orange" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-stone-900 text-base font-semibold">
                {sitter.name}
              </span>
              {sitter.certified && (
                <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium leading-3">
                  인증
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500 text-sm">
                  {sitter.district} {sitter.neighborhood}
                </span>
              {distance !== undefined && (
                <span className="text-gray-400 text-xs">
                  · {formatDistance(distance)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 서비스 태그 */}
        <div className="flex gap-2 mt-4">
          {sitter.services.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>

        {/* 평점·가격 */}
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
  const [activeFilter, setActiveFilter] = useState<Filter>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedSitterId, setSelectedSitterId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setUserPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {}, // 권한 거부 시 기본 순서 유지
    );
  }, []);

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

  const filtered = PETSITTERS.filter((s) => {
    const matchFilter =
      activeFilter === "전체"
        ? true
        : activeFilter === "인증만"
          ? s.certified
          : s.services.includes(activeFilter);
    const matchSearch =
      searchQuery === "" ||
      s.name.includes(searchQuery) ||
      s.district.includes(searchQuery) ||
      s.neighborhood.includes(searchQuery);
    return matchFilter && matchSearch;
  }).sort((a, b) => {
    if (sortBy === "평점순") return b.rating - a.rating;
    if (sortBy === "리뷰 많은 순") return b.reviewCount - a.reviewCount;
    if (sortBy === "낮은 가격순") return a.price - b.price;
    if (sortBy === "높은 가격순") return b.price - a.price;
    if (!userPosition) return 0;
    return (
      haversineKm(userPosition.lat, userPosition.lng, a.lat, a.lng) -
      haversineKm(userPosition.lat, userPosition.lng, b.lat, b.lng)
    );
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-orange-50 overflow-x-hidden md:overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
          {/* 지도 영역 */}
          <div className="h-[40vh] md:h-full md:flex-1 relative overflow-hidden">
            <KakaoMap
              markers={filtered.map(
                ({ lat, lng, id, certified, name, district, neighborhood }) => ({
                  lat,
                  lng,
                  id,
                  certified,
                  name,
                  district,
                  neighborhood,
                }),
              )}
              center={userPosition ?? DEFAULT_CENTER}
              level={7}
              selectedMarkerId={selectedSitterId}
              onMarkerClick={setSelectedSitterId}
            />
          </div>

          {/* 리스트 패널 */}
          <div className="w-full md:w-153.5 bg-white flex flex-col md:overflow-hidden">
            {/* 검색·필터 헤더 */}
            <div className="p-4 md:p-6 border-b border-orange-100 shrink-0">
              <SearchFilterBar
                placeholder="지역, 펫시터 검색"
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

            {/* 결과 리스트 */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 md:p-6">
                <p className="text-stone-900 text-lg font-semibold mb-4">
                  {sortBy
                    ? `${sortBy} · ${filtered.length}명`
                    : userPosition
                      ? `내 위치 기준 가까운 순 · ${filtered.length}명`
                      : `총 ${filtered.length}명의 펫시터`}
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
                        distance={
                          userPosition
                            ? haversineKm(
                                userPosition.lat,
                                userPosition.lng,
                                sitter.lat,
                                sitter.lng,
                              )
                            : undefined
                        }
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
