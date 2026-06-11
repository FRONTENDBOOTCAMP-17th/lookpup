"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";

const FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책", "인증만"] as const;
type Filter = (typeof FILTERS)[number];

const PETSITTERS = [
  {
    id: 1,
    name: "김민지",
    initial: "김",
    district: "마포구",
    rating: 4.9,
    reviewCount: 47,
    price: 30000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.5665,
    lng: 126.9013,
  },
  {
    id: 2,
    name: "이서연",
    initial: "이",
    district: "강남구",
    rating: 4.8,
    reviewCount: 32,
    price: 35000,
    services: ["방문돌봄", "산책"],
    certified: false,
    lat: 37.5172,
    lng: 127.0473,
  },
  {
    id: 3,
    name: "박준호",
    initial: "박",
    district: "용산구",
    rating: 4.7,
    reviewCount: 28,
    price: 28000,
    services: ["방문돌봄", "산책"],
    certified: false,
    lat: 37.5326,
    lng: 126.9907,
  },
  {
    id: 4,
    name: "최예진",
    initial: "최",
    district: "성동구",
    rating: 4.6,
    reviewCount: 15,
    price: 32000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.5633,
    lng: 127.0369,
  },
  {
    id: 5,
    name: "정수아",
    initial: "정",
    district: "송파구",
    rating: 4.5,
    reviewCount: 52,
    price: 38000,
    services: ["방문돌봄", "산책"],
    certified: false,
    lat: 37.5145,
    lng: 127.1059,
  },
  {
    id: 6,
    name: "강태윤",
    initial: "강",
    district: "광진구",
    rating: 4.9,
    reviewCount: 38,
    price: 25000,
    services: ["방문돌봄", "산책"],
    certified: false,
    lat: 37.5385,
    lng: 127.0823,
  },
  {
    id: 7,
    name: "윤지우",
    initial: "윤",
    district: "서초구",
    rating: 4.8,
    reviewCount: 41,
    price: 33000,
    services: ["방문돌봄", "산책"],
    certified: true,
    lat: 37.4837,
    lng: 127.0325,
  },
  {
    id: 8,
    name: "한소미",
    initial: "한",
    district: "영등포구",
    rating: 4.7,
    reviewCount: 23,
    price: 29000,
    services: ["방문돌봄", "산책"],
    certified: false,
    lat: 37.5264,
    lng: 126.8962,
  },
];

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

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
              <span className="text-gray-500 text-sm">{sitter.district}</span>
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
            <span
              key={s}
              className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full"
            >
              {s}
            </span>
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
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedSitterId, setSelectedSitterId] = useState<number | null>(null);
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
    cardRefs.current
      .get(selectedSitterId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSitterId]);

  const filtered = PETSITTERS.filter((s) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "인증만") return s.certified;
    return s.services.includes(activeFilter);
  }).sort((a, b) => {
    if (!userPosition) return 0;
    return (
      haversineKm(userPosition.lat, userPosition.lng, a.lat, a.lng) -
      haversineKm(userPosition.lat, userPosition.lng, b.lat, b.lng)
    );
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="flex h-[calc(100vh-64px)]">
          {/* 지도 영역 */}
          <div className="flex-1 relative overflow-hidden">
            <KakaoMap
              markers={filtered.map(({ lat, lng, id, certified }) => ({
                lat,
                lng,
                id,
                certified,
              }))}
              center={SEOUL_CENTER}
              level={8}
              onMarkerClick={setSelectedSitterId}
            />
          </div>

          {/* 리스트 패널 */}
          <div className="w-[614px] bg-white flex flex-col overflow-hidden">
            {/* 검색·필터 헤더 */}
            <div className="p-6 border-b border-orange-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl">
                  <Search size={20} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="지역, 펫시터 검색"
                    className="flex-1 bg-transparent text-stone-900 placeholder-stone-900/50 text-base outline-none"
                  />
                </div>
                <button className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors">
                  <SlidersHorizontal size={20} className="text-stone-900" />
                </button>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex gap-2 mt-4">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === f
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-gray-500 hover:bg-orange-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* 결과 리스트 */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-stone-900 text-lg font-semibold mb-4">
                {userPosition
                  ? "현위치 기준 가까운 순"
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
          </div>
        </div>
      </main>
    </>
  );
}
