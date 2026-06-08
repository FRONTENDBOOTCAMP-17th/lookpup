"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import Header from "@/components/layout/Header";

//임시 필터 옵션 (추후 수정 가능)
const FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책", "인증만"] as const;
type Filter = (typeof FILTERS)[number];

//더미데이터
const PETSITTERS = [
  { id: 1, name: "김민지", initial: "김", district: "마포구", rating: 4.9, reviewCount: 47, price: 30000, services: ["방문돌봄", "산책"], certified: true },
  { id: 2, name: "이서연", initial: "이", district: "강남구", rating: 4.8, reviewCount: 32, price: 35000, services: ["방문돌봄", "산책"], certified: false },
  { id: 3, name: "박준호", initial: "박", district: "용산구", rating: 4.7, reviewCount: 28, price: 28000, services: ["방문돌봄", "산책"], certified: false },
  { id: 4, name: "최예진", initial: "최", district: "성동구", rating: 4.6, reviewCount: 15, price: 32000, services: ["방문돌봄", "산책"], certified: true },
  { id: 5, name: "정수아", initial: "정", district: "송파구", rating: 4.5, reviewCount: 52, price: 38000, services: ["방문돌봄", "산책"], certified: false },
  { id: 6, name: "강태윤", initial: "강", district: "광진구", rating: 4.9, reviewCount: 38, price: 25000, services: ["방문돌봄", "산책"], certified: false },
  { id: 7, name: "윤지우", initial: "윤", district: "서초구", rating: 4.8, reviewCount: 41, price: 33000, services: ["방문돌봄", "산책"], certified: true },
  { id: 8, name: "한소미", initial: "한", district: "영등포구", rating: 4.7, reviewCount: 23, price: 29000, services: ["방문돌봄", "산책"], certified: false },
];

const MAP_PINS = [
  { left: "230px", top: "370px" },
  { left: "558px", top: "515px" },
  { left: "307px", top: "1037px" },
];

function PetsitterCard({ sitter }: { sitter: (typeof PETSITTERS)[number] }) {
  return (
    <Link href={`/petsitters/${sitter.id}`} className="block">
      <div className="w-full p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col gap-0 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow cursor-pointer">
        {/* 프로필 행 */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-orange-50 rounded-full border-2 border-orange-100 flex items-center justify-center shrink-0">
            <span className="text-orange-500 text-xl font-semibold">{sitter.initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-stone-900 text-base font-semibold">{sitter.name}</span>
              {sitter.certified && (
                <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium leading-3">
                  인증
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500 text-sm">{sitter.district}</span>
            </div>
          </div>
        </div>

        {/* 서비스 태그 */}
        <div className="flex gap-2 mt-4">
          {sitter.services.map((s) => (
            <span key={s} className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full">
              {s}
            </span>
          ))}
        </div>

        {/* 평점·가격 */}
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
    </Link>
  );
}

export default function PetsittersPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("전체");

  const filtered = PETSITTERS.filter((s) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "인증만") return s.certified;
    return s.services.includes(activeFilter);
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="flex h-[calc(100vh-64px)]">
          {/* 지도 영역 */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-4">
              <MapPin size={64} className="text-gray-400" />
              <span className="text-gray-500 text-lg font-semibold">Kakao Map</span>
            </div>
            {MAP_PINS.map((pin, i) => (
              <div
                key={i}
                style={{ left: pin.left, top: pin.top }}
                className="absolute w-14 h-14 bg-orange-500 rounded-full shadow-lg flex items-center justify-center"
              >
                <span className="text-white text-2xl">🐾</span>
              </div>
            ))}
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
                총 {filtered.length}명의 펫시터
              </p>
              <div className="flex flex-col gap-4">
                {filtered.map((sitter) => (
                  <PetsitterCard key={sitter.id} sitter={sitter} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
