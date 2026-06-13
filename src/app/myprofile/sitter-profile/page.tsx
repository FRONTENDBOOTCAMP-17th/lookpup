"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Star, Shield, Eye, Heart, Share2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

// Mock data (추후 DB 연결 시 이 객체만 교체)

const sitterProfileMock = {
  name: "김민지",
  initial: "김",
  location: "서울 마포구",
  lat: 37.5665,
  lng: 126.9013,
  rating: 4.9,
  reviewCount: 47,
  verified: true,
  hasCert: true,
  services: ["방문돌봄", "위탁돌봄", "산책"],
  intro:
    "안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다. 강아지와 고양이 모두 사랑하며, 각각의 성격과 특성을 이해하고 맞춤 케어를 제공합니다.",
  description:
    "안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다.\n\n강아지와 고양이 모두 사랑하며, 각각의 성격과 특성을 이해하고 맞춤 케어를 제공합니다. 반려동물 행동교정사 자격증을 보유하고 있으며, 응급처치 교육도 이수했습니다.",
  career: "5년",
  completedCount: "230+",
  pets: ["강아지 소형", "강아지 중형", "고양이"],
  serviceList: [
    {
      name: "방문돌봄",
      unit: "1일",
      price: 30000,
      desc: "하루 2-3회 방문하여 식사, 산책, 놀이 제공",
    },
    {
      name: "위탁돌봄",
      unit: "1일",
      price: 35000,
      desc: "펫시터 집에서 24시간 케어",
    },
    {
      name: "산책",
      unit: "1시간",
      price: 15000,
      desc: "1시간 산책 서비스",
    },
  ],
  reviews: [
    {
      author: "박지은",
      initial: "박",
      date: "2024.05.15",
      rating: 5,
      text: "정말 꼼꼼하게 돌봐주셨어요. 사진도 많이 보내주시고 안심됐습니다!",
    },
    {
      author: "최민수",
      initial: "최",
      date: "2024.05.08",
      rating: 5,
      text: "우리 강아지가 너무 좋아했어요. 다음에도 부탁드릴게요.",
    },
    {
      author: "김서연",
      initial: "김",
      date: "2024.04.22",
      rating: 4,
      text: "친절하시고 시간 약속도 잘 지키세요.",
    },
  ],
  ratingBars: [
    { rating: 5, count: 40, pct: 85 },
    { rating: 4, count: 5, pct: 12 },
    { rating: 3, count: 2, pct: 3 },
    { rating: 2, count: 0, pct: 0 },
    { rating: 1, count: 0, pct: 0 },
  ],
};

// 탭 정의 
type TabId = "intro" | "services" | "reviews" | "location";

const TABS: { id: TabId; label: string }[] = [
  { id: "intro", label: "소개" },
  { id: "services", label: "서비스" },
  { id: "reviews", label: "후기" },
  { id: "location", label: "위치" },
];

// 좌측 요약 카드

function SitterSummaryCard() {
  const s = sitterProfileMock;
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] overflow-hidden">
      {/* 프로필 이미지 영역 */}
      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Avatar initial={s.initial} size="2xl" variant="dark" />
      </div>

      <div className="p-5 space-y-4">
        {/* 이름 + 배지 */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold text-stone-900">{s.name}</h2>
            {s.verified && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">
                인증
              </span>
            )}
            {s.hasCert && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                자격증 보유
              </span>
            )}
          </div>

          {/* 지역 */}
          <div className="flex items-center gap-1 text-gray-400 mb-2">
            <MapPin size={13} />
            <span className="text-xs">{s.location}</span>
          </div>

          {/* 별점 */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-sm font-bold text-stone-900">{s.rating}</span>
            <span className="text-xs text-gray-400">({s.reviewCount})</span>
          </div>
        </div>

        {/* 서비스 태그 */}
        <div className="flex flex-wrap gap-1.5">
          {s.services.map((sv) => (
            <span
              key={sv}
              className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full"
            >
              {sv}
            </span>
          ))}
        </div>

        {/* 경력 / 완료 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "경력", value: s.career },
            { label: "완료", value: s.completedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-orange-50 rounded-xl py-2 text-center"
            >
              <p className="text-xs font-bold text-orange-500">{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 탭 콘텐츠 컴포넌트들

function SitterIntroSection() {
  const s = sitterProfileMock;
  return (
    <div className="space-y-4">
      {/* 소개 */}
      <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
        <h3 className="font-bold text-stone-900 mb-4">소개</h3>
        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
          {s.description}
        </p>
      </div>

      {/* 경력 및 실적 */}
      <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
        <h3 className="font-bold text-stone-900 mb-4">경력 및 실적</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "경력", value: s.career },
            { label: "완료 건수", value: s.completedCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl"
            >
              <Shield size={22} className="text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="text-sm font-bold text-stone-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 돌봄 가능 */}
      <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
        <h3 className="font-bold text-stone-900 mb-4">돌봄 가능</h3>
        <div className="flex flex-wrap gap-2">
          {s.pets.map((pet) => (
            <span
              key={pet}
              className="px-4 py-2 bg-orange-50 text-orange-500 text-sm rounded-full"
            >
              {pet}
            </span>
          ))}
        </div>
      </div>

      {/* 사진 */}
      <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
        <h3 className="font-bold text-stone-900 mb-4">사진</h3>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SitterServicesSection() {
  const s = sitterProfileMock;
  return (
    <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
      <h3 className="font-bold text-stone-900 mb-4">제공 서비스 및 가격</h3>
      <div className="space-y-3">
        {s.serviceList.map((item) => (
          <div
            key={item.name}
            className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-stone-900">
                  {item.name}
                </span>
                <span className="text-xs text-gray-400">({item.unit})</span>
              </div>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <span className="text-sm font-bold text-orange-500 shrink-0">
              {item.price.toLocaleString("ko-KR")}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SitterReviewsSection() {
  const s = sitterProfileMock;
  return (
    <div className="space-y-4">
      {/* 평점 요약 */}
      <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-500 mb-1">
              {s.rating}
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{s.reviewCount}개 리뷰</p>
          </div>
          <div className="flex-1 space-y-2">
            {s.ratingBars.map((bar) => (
              <div key={bar.rating} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-6">{bar.rating}점</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4">{bar.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리뷰 카드 */}
      {s.reviews.map((review) => (
        <div
          key={review.author}
          className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar initial={review.initial} variant="dark" />
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {review.author}
                </p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400">{review.date}</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{review.text}</p>
        </div>
      ))}
    </div>
  );
}

function SitterLocationSection() {
  const s = sitterProfileMock;
  return (
    <div className="p-6 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)]">
      <h3 className="font-bold text-stone-900 mb-4">활동 지역</h3>
      <div className="h-64 rounded-xl overflow-hidden">
        <KakaoMap
          markers={[{ lat: s.lat, lng: s.lng, id: 0 }]}
          center={{ lat: s.lat, lng: s.lng }}
          level={5}
        />
      </div>
      <p className="mt-4 text-sm text-gray-400 flex items-center gap-1">
        <MapPin size={13} />
        서울 마포구 일대 (반경 3km)
      </p>
    </div>
  );
}

//  탭 콘텐츠 라우터 

function SitterProfileTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="border-b border-orange-100 mb-6">
      <div className="flex gap-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id
                ? "text-orange-500"
                : "text-gray-400 hover:text-stone-900"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

//페이지

export default function SitterProfilePreviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("intro");
  const s = sitterProfileMock;

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      {/* PC 헤더 */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* ── 모바일/태블릿 레이아웃 ── */}
      <div className="lg:hidden flex flex-col bg-white">
        {/* 상단 이미지 영역 */}
        <div className="relative w-full h-44 bg-gradient-to-br from-gray-200 to-gray-300 shrink-0">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.back()}
            className="absolute top-12 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          {/* 하트/공유 */}
          <div className="absolute top-12 right-4 flex gap-2">
            <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <Heart size={18} className="text-stone-900" />
            </button>
            <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <Share2 size={18} className="text-stone-900" />
            </button>
          </div>
          {/* 아바타 + 이름/위치 오버레이 */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <Avatar initial={s.initial} size="lg" variant="dark" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-stone-900">{s.name}</h2>
                {s.verified && (
                  <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">인증</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin size={11} />
                <span className="text-xs">{s.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 별점 */}
        <div className="px-5 py-3 bg-white flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
          ))}
          <span className="text-sm font-bold text-stone-900">{s.rating}</span>
          <span className="text-xs text-gray-400">({s.reviewCount}개 리뷰)</span>
        </div>

        {/* 서비스 태그 */}
        <div className="flex flex-wrap gap-1.5 px-5 pb-4 bg-white">
          {s.services.map((sv) => (
            <span key={sv} className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full">{sv}</span>
          ))}
        </div>

        {/* 탭 바 */}
        <div className="bg-white border-b border-orange-100 px-5 sticky top-0 z-10">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id ? "text-orange-500" : "text-gray-400"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 px-5 py-5 pb-44 bg-orange-50">
          {activeTab === "intro" && <SitterIntroSection />}
          {activeTab === "services" && <SitterServicesSection />}
          {activeTab === "reviews" && <SitterReviewsSection />}
          {activeTab === "location" && <SitterLocationSection />}
        </div>

        {/* 예약하기 버튼 (바텀 네비 위) */}
        <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-white border-t border-orange-100 px-5 py-3">
          <button className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition-colors">
            예약하기
          </button>
        </div>

        <MobileBottomNav />
      </div>

      {/* ── PC 레이아웃 ── */}
      <main className="hidden lg:block flex-1">
        <div className="max-w-[1152px] mx-auto px-8 py-12">
          {/* 미리보기 안내 배너 */}
          <div className="flex items-center gap-3 mb-8 px-4 py-3 bg-orange-500/10 border border-orange-200 rounded-xl">
            <Eye size={16} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-600">
              이 페이지는 보호자에게 보이는 내 프로필 미리보기입니다.
            </p>
            <button
              onClick={() => router.back()}
              className="ml-auto flex items-center gap-1 text-xs text-orange-500 hover:underline shrink-0"
            >
              <ChevronLeft size={14} />
              돌아가기
            </button>
          </div>

          <div className="flex gap-8 items-start">
            {/* 좌측 요약 카드 (sticky) */}
            <div className="w-80 shrink-0 sticky top-24">
              <SitterSummaryCard />
            </div>

            {/* 우측 탭 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <SitterProfileTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              {activeTab === "intro" && <SitterIntroSection />}
              {activeTab === "services" && <SitterServicesSection />}
              {activeTab === "reviews" && <SitterReviewsSection />}
              {activeTab === "location" && <SitterLocationSection />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
