"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star, MapPin, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";

interface FavoriteSitter {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  services: string[];
  verified: boolean;
}

// 더미데이터

const DUMMY_FAVORITES: FavoriteSitter[] = [
  {
    id: 1,
    name: "김민지",
    location: "마포구 상수동",
    rating: 4.9,
    reviewCount: 47,
    price: 30000,
    services: ["방문돌봄", "산책"],
    verified: true,
  },
  {
    id: 2,
    name: "이서연",
    location: "강남구 역삼동",
    rating: 4.8,
    reviewCount: 32,
    price: 35000,
    services: ["위탁돌봄", "산책"],
    verified: true,
  },
  {
    id: 3,
    name: "박준호",
    location: "용산구 한남동",
    rating: 4.7,
    reviewCount: 28,
    price: 28000,
    services: ["방문돌봄", "픽업"],
    verified: false,
  },
  {
    id: 4,
    name: "최예진",
    location: "성동구 성수동",
    rating: 4.9,
    reviewCount: 15,
    price: 32000,
    services: ["산책", "펫호텔"],
    verified: true,
  },
  {
    id: 5,
    name: "정수아",
    location: "송파구 잠실동",
    rating: 5.0,
    reviewCount: 52,
    price: 38000,
    services: ["방문돌봄", "위탁돌봄"],
    verified: true,
  },
  {
    id: 6,
    name: "강태윤",
    location: "광진구 자양동",
    rating: 4.6,
    reviewCount: 38,
    price: 25000,
    services: ["산책"],
    verified: false,
  },
  {
    id: 7,
    name: "윤지우",
    location: "서초구 반포동",
    rating: 4.8,
    reviewCount: 41,
    price: 33000,
    services: ["방문돌봄", "위탁돌봄"],
    verified: true,
  },
  {
    id: 8,
    name: "한소미",
    location: "영등포구 여의도동",
    rating: 4.7,
    reviewCount: 23,
    price: 29000,
    services: ["산책", "픽업"],
    verified: false,
  },
];

// 컴포넌트

function SitterCard({
  sitter,
  onUnfavorite,
}: {
  sitter: FavoriteSitter;
  onUnfavorite: () => void;
}) {
  return (
    <div className="relative bg-white border border-[#FFE9D6] rounded-2xl overflow-hidden hover:border-[#E8742A] hover:shadow-[0_2px_12px_rgba(232,116,42,0.10)] transition-all">
      {/* 찜 해제 버튼 */}
      <button
        onClick={onUnfavorite}
        className="absolute top-3 right-3 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="찜 해제"
      >
        <Heart size={20} className="text-[#EF4444]" fill="currentColor" />
      </button>

      {/* 프로필 링크 */}
      <Link href={`/petsitters/${sitter.id}`} className="block p-5">
        {/* 아바타 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#FFF0E8] rounded-full border border-[#FFE9D6] flex items-center justify-center">
            <span className="text-[#E8742A] text-2xl font-semibold">
              {sitter.name[0]}
            </span>
          </div>
        </div>

        {/* 이름 및 인증 */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="font-semibold text-[#281A0E] text-base">
              {sitter.name}
            </h3>
            {sitter.verified && (
              <span className="text-[9px] px-1.5 py-0.5 bg-[#E8742A] text-white rounded font-medium">
                인증
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-[#6B7280]">
            <MapPin size={13} />
            <span>{sitter.location}</span>
          </div>
        </div>

        {/* 제공 서비스 */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {sitter.services.map((service) => (
            <span
              key={service}
              className="text-[10px] px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#E8742A] font-medium"
            >
              {service}
            </span>
          ))}
        </div>

        {/* 평점 및 가격 */}
        <div className="pt-3 border-t border-[#FFE9D6] space-y-2">
          <div className="flex items-center justify-center gap-1">
            <Star size={15} className="fill-[#F59E0B] text-[#F59E0B]" />
            <span className="font-bold text-sm">{sitter.rating}</span>
            <span className="text-xs text-[#6B7280]">
              ({sitter.reviewCount})
            </span>
          </div>
          <div className="text-center font-bold text-base text-[#E8742A]">
            {sitter.price.toLocaleString()}원~
          </div>
        </div>
      </Link>
    </div>
  );
}

// 페이지

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteSitter[]>(DUMMY_FAVORITES);

  const handleUnfavorite = (id: number) => {
    setFavorites((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3]">
      {/* 데스크탑 헤더 */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">
            찜한 펫시터
          </span>
        </div>
      </div>

      <main className="flex-1 pb-20 md:pb-0">
        {/* 데스크탑 페이지 헤더 */}
        <div className="hidden md:block bg-white border-b border-[#FFE9D6] pt-8 pb-6">
          <div className="max-w-[1280px] mx-auto px-10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-[#281A0E]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#281A0E]">찜한 펫시터</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                총 {favorites.length}명의 펫시터를 찜했습니다
              </p>
            </div>
          </div>
        </div>

        {/* 모바일 부제목 */}
        <div className="md:hidden bg-white border-b border-[#FFE9D6] pt-4 pb-3 px-5">
          <p className="text-sm text-[#6B7280]">
            총 {favorites.length}명의 펫시터를 찜했습니다
          </p>
        </div>

        {/* 카드 목록 */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-6 md:py-8">
          {favorites.length === 0 ? (
            /* 빈 상태 */
            <div className="text-center py-16 md:py-20">
              <div className="w-20 h-20 bg-[#FFF0E8] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={36} className="text-[#FFE9D6]" />
              </div>
              <p className="text-[#6B7280] text-sm md:text-base mb-4">
                아직 찜한 펫시터가 없습니다
              </p>
              <button
                onClick={() => router.push("/petsitters")}
                className="text-[#E8742A] font-medium hover:underline"
              >
                펫시터 찾아보기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {favorites.map((sitter) => (
                <SitterCard
                  key={sitter.id}
                  sitter={sitter}
                  onUnfavorite={() => handleUnfavorite(sitter.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
