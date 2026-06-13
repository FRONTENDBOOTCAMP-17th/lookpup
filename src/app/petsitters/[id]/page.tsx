"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";
import { MapPin, Star, ChevronLeft } from "lucide-react";

const SITTER = {
  name: "김민지",
  initial: "김",
  district: "서울 마포구",
  rating: 4.9,
  reviewCount: 47,
  certified: true,
  services: ["방문돌봄", "위탁돌봄", "산책"],
  bio: "안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다.\n\n강아지와 고양이 모두 사랑하며, 각각의 성격과 특성을 이해하고 맞춤 케어를 제공합니다. 반려동물 행동교정사 자격증을 보유하고 있으며, 응급처치 교육도 이수했습니다.",
  experience: "5년",
  completedCount: "230+",
  pets: ["강아지 소형", "강아지 중형", "고양이"],
  lat: 37.5548,
  lng: 126.9236,
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

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

export default function PetsitterProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("소개");

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-12">
          <Link
            href="/petsitters"
            className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors w-fit mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-base">목록으로</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 md:items-start">
            {/* 왼쪽: 프로필 카드 */}
            <div className="w-full md:w-85.25 md:shrink-0 bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col items-center">
              {/* 프로필 이미지 */}
              <div className="w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4" />

              {/* 이름 + 인증 배지 */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-stone-900 text-2xl font-bold">
                  {SITTER.name}
                </span>
                {SITTER.certified && (
                  <span className="px-3 py-1 bg-[#E8742A] rounded-md text-white text-xs font-medium">
                    인증
                  </span>
                )}
              </div>

              {/* 위치 */}
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-3">
                <MapPin size={14} />
                <span className="text-sm">{SITTER.district}</span>
              </div>

              {/* 별점 + 리뷰 수 */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="text-stone-900 text-lg font-bold ml-1">
                  {SITTER.rating.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  ({SITTER.reviewCount})
                </span>
              </div>

              {/* 서비스 태그 */}
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {SITTER.services.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-orange-50 text-[#E8742A] text-xs font-medium rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* 예약하기 버튼 */}
              <Link
                href="/petsitters/1/book"
                className="w-full h-[52px] bg-[#E8742A] hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center transition-colors"
              >
                예약하기
              </Link>
            </div>

            {/* 오른쪽: 탭 + 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 탭 네비게이션 */}
              <div className="border-b border-orange-100 flex gap-8 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-semibold relative transition-colors ${
                      activeTab === tab
                        ? "text-[#E8742A]"
                        : "text-gray-500 hover:text-stone-900"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8742A]" />
                    )}
                  </button>
                ))}
              </div>

              {/* 소개 탭 */}
              {activeTab === "소개" && (
                <div className="flex flex-col gap-6">
                  <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                    <h3 className="text-stone-900 text-lg font-semibold mb-4">
                      소개
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
                      {SITTER.bio}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                    <h3 className="text-stone-900 text-lg font-semibold mb-4">
                      경력 및 실적
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center">
                        <span className="text-[#E8742A] text-3xl font-bold">
                          {SITTER.experience}
                        </span>
                        <span className="text-gray-500 text-sm mt-2">경력</span>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center">
                        <span className="text-[#E8742A] text-3xl font-bold">
                          {SITTER.completedCount}
                        </span>
                        <span className="text-gray-500 text-sm mt-2">
                          완료 건수
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                    <h3 className="text-stone-900 text-lg font-semibold mb-4">
                      돌봄 가능
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {SITTER.pets.map((pet) => (
                        <span
                          key={pet}
                          className="px-3 py-1 bg-orange-50 text-[#E8742A] text-xs font-medium rounded-full"
                        >
                          {pet}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                    <h3 className="text-stone-900 text-lg font-semibold mb-4">
                      사진
                    </h3>
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
                <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                  <h3 className="text-stone-900 text-lg font-semibold mb-4">
                    제공 서비스 및 가격
                  </h3>
                  <div className="flex flex-col gap-4">
                    {SERVICES_PRICE.map((item, idx) => (
                      <div key={idx} className="p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-900 text-sm font-medium">
                            {item.service}
                          </span>
                          <span className="text-[#E8742A] text-xl font-bold">
                            {item.price}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-500 text-sm">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 후기 탭 */}
              {activeTab === "후기" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-5xl font-bold text-[#E8742A] mb-1">
                          {SITTER.rating.toFixed(1)}
                        </p>
                        <div className="flex items-center gap-0.5 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className="fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        <p className="text-gray-500 text-sm">
                          {SITTER.reviewCount}개 리뷰
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-3">
                            <span className="text-gray-500 text-sm w-8">
                              {rating}점
                            </span>
                            <div className="flex-1 h-2 bg-orange-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{
                                  width:
                                    rating === 5
                                      ? "85%"
                                      : rating === 4
                                        ? "12%"
                                        : "3%",
                                }}
                              />
                            </div>
                            <span className="text-gray-500 text-sm w-6 text-right">
                              {rating === 5 ? "40" : rating === 4 ? "5" : "2"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {REVIEWS.map((review, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initial={review.initial}
                            size="md"
                            variant="orange"
                          />
                          <div>
                            <p className="text-stone-900 text-sm font-semibold">
                              {review.name}
                            </p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className="fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {review.date}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">
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
                    서비스 위치
                  </h3>
                  <div className="h-100 rounded-xl overflow-hidden">
                    <KakaoMap
                      markers={[
                        {
                          lat: SITTER.lat,
                          lng: SITTER.lng,
                          id: 1,
                          certified: SITTER.certified,
                        },
                      ]}
                      center={{ lat: SITTER.lat, lng: SITTER.lng }}
                      level={5}
                    />
                  </div>
                  <p className="mt-4 text-gray-500 text-sm flex items-center gap-1">
                    <MapPin size={14} className="text-[#E8742A] shrink-0" />
                    서비스 반경: 마포구 전체 및 인근 지역
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
