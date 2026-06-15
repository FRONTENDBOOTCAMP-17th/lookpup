"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";
import BackButton from "@/components/common/BackButton";
import Pill from "@/components/ui/Pill";
import { MapPin, Star, ChevronLeft } from "lucide-react";

// 더미더미더미
const SITTER = {
  id: "dummy-uuid",
  user_id: "dummy-uuid",
  full_name: "김민지",
  profile_image: null as string | null,
  title: null as string | null,
  introduction:
    "안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다.\n\n강아지와 고양이 모두 사랑하며, 각각의 성격과 특성을 이해하고 맞춤 케어를 제공합니다. 반려동물 행동교정사 자격증을 보유하고 있으며, 응급처치 교육도 이수했습니다.",
  career: "5년",
  available_area: "서울 마포구",
  latitude: 37.5548,
  longitude: 126.9236,
  base_price: 30000,
  rating: 4.9,
  status: "approved" as "pending" | "approved" | "rejected",
  is_verified: true,
  services: ["방문돌봄", "위탁돌봄", "산책"],
  review_count: 47,
  // 이쪽은 확인해볼 것
  completedCount: "230+",
  pets: ["강아지 소형", "강아지 중형", "고양이"],
  ratingBreakdown: { 5: 40, 4: 5, 3: 1, 2: 1, 1: 0 } as Record<number, number>,
};

const SERVICES_PRICE = [
  {
    service: "방문돌봄 (1일)",
    price: "30,000원",
    desc: "하루 2-3회 방문하여 식사, 산책, 놀이 제공",
  },
  {
    service: "위탁돌봄 (1일)",
    price: "35,000원",
    desc: "펫시터 집에서 24시간 케어",
  },
  { service: "산책 (1시간)", price: "15,000원", desc: "1시간 산책 서비스" },
];

const REVIEWS = [
  {
    name: "박서현",
    initial: "박",
    date: "2024.05.20",
    content:
      "우리 아이를 정말 잘 돌봐주셨어요! 사진도 자주 보내주시고 꼼꼼하게 케어해주셔서 안심하고 맡길 수 있었습니다.",
  },
  {
    name: "이준호",
    initial: "이",
    date: "2024.05.19",
    content: "친절하고 전문적인 케어 감사합니다. 강아지가 무척 좋아했어요.",
  },
  {
    name: "최예진",
    initial: "최",
    date: "2024.05.18",
    content: "꼼꼼한 일지 덕분에 여행 내내 안심했어요. 재방문 의사 있습니다.",
  },
  {
    name: "정민수",
    initial: "정",
    date: "2024.05.17",
    content: "응급 상황에도 침착하게 대응해주셔서 믿음이 가요.",
  },
  {
    name: "강소연",
    initial: "강",
    date: "2024.05.16",
    content: "산책 중에도 사진 보내주시고 정말 성실하세요!",
  },
];

const STATS = [
  { label: "경력", value: SITTER.career },
  { label: "완료", value: SITTER.completedCount },
];

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

function StarRow({ size }: { size: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
      ))}
    </>
  );
}

function StatGrid({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      {STATS.map((item) => (
        <div
          key={item.label}
          className="bg-orange-50 rounded-xl py-2 text-center"
        >
          <p className="text-xs font-bold text-orange-500">{item.value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function PetsitterProfilePage() {
  const params = useParams();
  const sitterId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("소개");

  const renderTabContent = () => (
    <>
      {/* 소개 탭 */}
      {activeTab === "소개" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <h3 className="font-bold text-stone-900 mb-4">소개</h3>
            <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
              {SITTER.introduction}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <h3 className="font-bold text-stone-900 mb-4">돌봄 가능</h3>
            <div className="flex gap-2 flex-wrap">
              {SITTER.pets.map((pet) => (
                <Pill key={pet}>{pet}</Pill>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <h3 className="font-bold text-stone-900 mb-4">사진</h3>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg bg-linear-to-br from-gray-100 to-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 서비스 탭 */}
      {activeTab === "서비스" && (
        <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
          <h3 className="font-bold text-stone-900 mb-4">제공 서비스 및 가격</h3>
          <div className="flex flex-col gap-3">
            {SERVICES_PRICE.map((item, idx) => (
              <div
                key={idx}
                className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <span className="text-sm font-semibold text-stone-900">
                    {item.service}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                <span className="text-base font-bold text-orange-500 shrink-0">
                  {item.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 후기 탭 */}
      {activeTab === "후기" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-orange-500 mb-1">
                  {SITTER.rating.toFixed(1)}
                </p>
                <div className="flex items-center gap-0.5 justify-center mb-1">
                  <StarRow size={14} />
                </div>
                <p className="text-xs text-gray-400">
                  {SITTER.review_count}개 리뷰
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6">
                      {rating}점
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          // 전체 리뷰 수 대비 해당 별점 비율
                          width: `${Math.round((SITTER.ratingBreakdown[rating] / SITTER.review_count) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">
                      {SITTER.ratingBreakdown[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {REVIEWS.map((review, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={review.initial} size="md" variant="orange" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {review.name}
                    </p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <StarRow size={11} />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 위치 탭 */}
      {activeTab === "위치" && (
        <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
          <h3 className="text-stone-900 text-lg font-semibold mb-4">
            활동 지역
          </h3>
          <div className="h-100 rounded-xl overflow-hidden">
            <KakaoMap
              markers={[
                {
                  lat: SITTER.latitude,
                  lng: SITTER.longitude,
                  id: 1,
                  certified: SITTER.is_verified,
                },
              ]}
              center={{ lat: SITTER.latitude, lng: SITTER.longitude }}
              level={5}
            />
          </div>
          <p className="mt-4 text-gray-500 text-sm flex items-center gap-1">
            <MapPin size={14} className="text-orange-500 shrink-0" />
            서비스 반경: 마포구 전체 및 인근 지역
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      <Header />

      {/* 데스크톱 전용: 뒤로가기 버튼 */}
      <div className="hidden md:block bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-12">
          <BackButton href="/petsitters" className="mb-6" />
        </div>
      </div>

      <div className="bg-orange-50">
        <div className="md:max-w-7xl md:mx-auto md:px-10 md:pb-12">
          <div className="md:flex md:gap-8 md:items-start">
            {/* 왼쪽: 모바일 이미지 헤더 / 데스크톱 프로필 카드 */}
            <div className="md:w-85.25 md:shrink-0">
              {/* 모바일 이미지 헤더 */}
              <div className="md:hidden relative w-full h-44 bg-linear-to-br from-gray-100 to-gray-200">
                <Link
                  href="/petsitters"
                  aria-label="펫시터 목록으로 돌아가기"
                  className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft
                    size={20}
                    className="text-stone-900"
                    aria-hidden="true"
                  />
                </Link>
                <div
                  className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl font-bold text-white">
                      {SITTER.full_name}
                    </h2>
                    {SITTER.is_verified && (
                      <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">
                        인증
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/80">
                    <MapPin size={11} aria-hidden="true" />
                    <span className="text-sm">{SITTER.available_area}</span>
                  </div>
                </div>
              </div>

              {/* 데스크톱 프로필 카드 */}
              <div className="hidden md:flex flex-col items-center bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                <div className="w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4" />

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-stone-900 text-2xl font-bold">
                    {SITTER.full_name}
                  </span>
                  {SITTER.is_verified && (
                    <span className="px-2 py-1 bg-orange-500 rounded-md text-white text-xs font-medium">
                      인증
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1 text-gray-500 mb-3">
                  <MapPin size={14} />
                  <span className="text-sm">{SITTER.available_area}</span>
                </div>

                <div className="flex items-center justify-center gap-1 mb-4">
                  <StarRow size={18} />
                  <span className="text-stone-900 text-lg font-bold ml-1">
                    {SITTER.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({SITTER.review_count})
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap justify-center mb-6">
                  {SITTER.services.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>

                <StatGrid className="w-full mb-6" />

                <Link
                  href={`/petsitters/${sitterId}/book`}
                  className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center transition-colors"
                >
                  예약하기
                </Link>
              </div>
            </div>

            {/* 오른쪽: 모바일 통계 + 공유 탭 영역 */}
            <div className="flex-1 min-w-0">
              {/* 모바일 전용: 별점 / 서비스 태그 / 통계 */}
              <div className="md:hidden bg-white">
                <div className="px-5 py-3 flex items-center gap-1.5">
                  <StarRow size={13} />
                  <span className="text-sm font-bold text-stone-900">
                    {SITTER.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({SITTER.review_count})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                  {SITTER.services.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>
                <StatGrid className="px-5 pb-5" />
              </div>

              {/* 탭 바 (모바일/데스크톱 공유) */}
              <div className="bg-white md:bg-transparent border-b border-orange-100 px-5 md:px-0 sticky top-0 md:static z-10">
                <div className="flex gap-6 md:gap-8">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm md:text-lg font-semibold transition-colors relative ${
                        activeTab === tab
                          ? "text-orange-500"
                          : "text-gray-400 md:hover:text-stone-900"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 탭 콘텐츠 — 단일 렌더 */}
              <div className="px-5 md:px-0 py-5 pb-24 md:pb-0">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 예약하기 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white border-t border-orange-100 px-5 py-3">
        <Link
          href={`/petsitters/${sitterId}/book`}
          className="block w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl text-sm text-center hover:bg-orange-600 transition-colors"
        >
          예약하기
        </Link>
      </div>

      <Footer />
    </>
  );
}
