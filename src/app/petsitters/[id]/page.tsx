"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";
import { MapPin, Star, Shield, Calendar, MessageCircle } from "lucide-react";

// 더미데이터

const TABS = ["소개", "서비스·가격", "이용 후기", "위치"];

const PETSITTER = {
  name: "김민지",
  initial: "김",
  location: "서울 마포구",
  lat: 37.5665,
  lng: 126.9013,
  rating: 4.9,
  reviewCount: 47,
  badges: [
    { label: "인증", bg: "bg-blue-100", text: "text-blue-700" },
    { label: "자격증 보유", bg: "bg-green-100", text: "text-green-700" },
  ],
  services: ["방문돌봄", "위탁돌봄", "산책"],
  intro:
    "안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다. 사랑으로 돌보며 안전하고 즐거운 시간을 만들어드립니다.",
  description: `안녕하세요! 5년 경력의 반려동물 전문 펫시터 김민지입니다.\n\n강아지와 고양이 모두 사랑하며, 각각의 성격과 특성을 이해하고 맞춤 케어를 제공합니다. 반려동물 행동교정사 자격증을 보유하고 있으며, 응급처치 교육도 이수했습니다.\n\n귀가 후 상세한 돌봄 일지와 사진을 제공해드리며, 보호자님이 안심하고 맡기실 수 있도록 최선을 다하겠습니다.`,
  stats: [
    { label: "경력", value: "5년" },
    { label: "완료 건수", value: "230+" },
  ],
  pets: ["강아지 (소형)", "강아지 (중형)", "고양이"],
};

const SERVICES = [
  { service: "방문돌봄 (1일)", price: "30,000원" },
  { service: "위탁돌봄 (1일)", price: "35,000원" },
  { service: "산책 (1시간)", price: "15,000원" },
  { service: "펫시터 (1박)", price: "45,000원" },
];

const REVIEWS = [
  { author: "박서현", initial: "박" },
  { author: "이준호", initial: "이" },
  { author: "최예진", initial: "최" },
  { author: "정민수", initial: "정" },
  { author: "강소연", initial: "강" },
];

const RATING_BARS = [
  { rating: 5, count: 40, width: "85%" },
  { rating: 4, count: 5, width: "12%" },
  { rating: 3, count: 2, width: "3%" },
  { rating: 2, count: 0, width: "0%" },
  { rating: 1, count: 0, width: "0%" },
];

// 페이지

export default function PetsitterPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-275 mx-auto px-8 py-12">
          <div className="grid grid-cols-[1fr_340px] gap-8">
            {/* 왼쪽 콘텐츠 */}
            <div>
              {/* 프로필 헤더 */}
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100 mb-6">
                <div className="flex items-start gap-6">
                  <Avatar
                    initial={PETSITTER.initial}
                    size="xl"
                    variant="dark"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold text-stone-900">
                            {PETSITTER.name} 펫시터
                          </h2>
                          {PETSITTER.badges.map((badge) => (
                            <span
                              key={badge.label}
                              className={`px-2 py-0.5 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 mb-2">
                          <MapPin size={16} />
                          <span className="text-sm">{PETSITTER.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className="fill-orange-400 text-orange-400"
                                size={16}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-stone-900">
                            {PETSITTER.rating}
                          </span>
                          <span className="text-sm text-gray-400">
                            (리뷰 {PETSITTER.reviewCount}개)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {PETSITTER.services.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2">
                      {PETSITTER.intro}
                    </p>
                  </div>
                </div>
              </div>

              {/* 탭 */}
              <div className="border-b border-orange-100 mb-6">
                <div className="flex gap-8">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 font-semibold transition-colors relative ${
                        activeTab === tab
                          ? "text-orange-500"
                          : "text-gray-400 hover:text-stone-900"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 탭: 소개 */}
              {activeTab === "소개" && (
                <div className="space-y-4">
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                    <h3 className="font-bold text-stone-900 mb-4">소개</h3>
                    <p className="text-gray-500 leading-relaxed whitespace-pre-line">
                      {PETSITTER.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {PETSITTER.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl"
                        >
                          <Shield className="text-orange-500" size={24} />
                          <div>
                            <div className="font-medium text-sm text-stone-900">
                              {stat.label}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {stat.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                    <h3 className="font-bold text-stone-900 mb-4">
                      돌봄 가능 반려동물
                    </h3>
                    <div className="flex gap-3">
                      {PETSITTER.pets.map((pet) => (
                        <span
                          key={pet}
                          className="px-4 py-2 bg-orange-50 text-orange-500 text-sm rounded-full"
                        >
                          {pet}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                    <h3 className="font-bold text-stone-900 mb-4">사진</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 탭: 서비스·가격 */}
              {activeTab === "서비스·가격" && (
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                  <h3 className="font-bold text-stone-900 mb-4">제공 서비스</h3>
                  <div className="space-y-0">
                    {SERVICES.map((item) => (
                      <div
                        key={item.service}
                        className="flex items-center justify-between py-4 border-b border-orange-100 last:border-0"
                      >
                        <div className="font-medium text-stone-900">
                          {item.service}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold text-orange-500">
                            {item.price}
                          </div>
                          <button className="px-3 py-1.5 text-sm border border-orange-200 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
                            예약하기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 탭: 이용 후기 */}
              {activeTab === "이용 후기" && (
                <div className="space-y-4">
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-5xl font-bold text-orange-500 mb-2">
                          {PETSITTER.rating}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="fill-orange-400 text-orange-400"
                              size={16}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {PETSITTER.reviewCount}개 리뷰
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {RATING_BARS.map((bar) => (
                          <div
                            key={bar.rating}
                            className="flex items-center gap-3"
                          >
                            <span className="text-sm text-gray-500 w-8">
                              {bar.rating}점
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400"
                                style={{ width: bar.width }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-8">
                              {bar.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {REVIEWS.map((review, idx) => (
                    <div
                      key={review.author}
                      className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar initial={review.initial} variant="dark" />
                          <div>
                            <div className="font-medium text-stone-900">
                              {review.author}
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="fill-orange-400 text-orange-400"
                                  size={12}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">
                          2024.05.{20 - idx}
                        </span>
                      </div>
                      <p className="text-gray-500 leading-relaxed">
                        우리 아이를 정말 잘 돌봐주셨어요! 사진도 자주 보내주시고
                        꼼꼼하게 케어해주셔서 안심하고 맡길 수 있었습니다.
                        다음에도 꼭 부탁드리고 싶어요.
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 탭: 위치 */}
              {activeTab === "위치" && (
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                  <h3 className="font-bold text-stone-900 mb-4">서비스 위치</h3>
                  <div className="h-100 rounded-xl overflow-hidden">
                    <KakaoMap
                      markers={[
                        {
                          lat: PETSITTER.lat,
                          lng: PETSITTER.lng,
                          id: 0,
                        },
                      ]}
                      center={{ lat: PETSITTER.lat, lng: PETSITTER.lng }}
                      level={5}
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-400 flex items-center gap-1">
                    <MapPin size={14} />
                    서비스 반경: 마포구 전체 및 인근 지역
                  </p>
                </div>
              )}
            </div>

            {/* 오른쪽 콘텐츠 - 예약 위젯 */}
            <div className="sticky top-24 h-fit">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
                <h3 className="font-bold text-stone-900 mb-6">예약하기</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-900 mb-2">
                      날짜
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Calendar
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="date"
                          className="w-full pl-10 pr-3 py-2 border border-orange-100 rounded-lg text-sm outline-none focus:border-orange-300"
                        />
                      </div>
                      <div className="relative">
                        <Calendar
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="date"
                          className="w-full pl-10 pr-3 py-2 border border-orange-100 rounded-lg text-sm outline-none focus:border-orange-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-900 mb-2">
                      반려동물
                    </label>
                    <select className="w-full px-3 py-2 border border-orange-100 rounded-lg text-sm outline-none focus:border-orange-300">
                      <option>반려동물 선택</option>
                      <option>댕댕이 (강아지)</option>
                      <option>냥냥이 (고양이)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-900 mb-2">
                      서비스
                    </label>
                    <select className="w-full px-3 py-2 border border-orange-100 rounded-lg text-sm outline-none focus:border-orange-300">
                      <option>서비스 선택</option>
                      {PETSITTER.services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mb-6 pb-6 border-b border-orange-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">방문돌봄 1일</span>
                    <span className="font-medium text-stone-900">30,000원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">플랫폼 수수료</span>
                    <span className="font-medium text-stone-900">3,000원</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-stone-900">총 결제금액</span>
                  <span className="font-bold text-2xl text-orange-500">
                    33,000원
                  </span>
                </div>

                <Link
                  href={`/petsitters/${PETSITTER.name}/book`}
                  className="block w-full mb-3 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-center transition-colors"
                >
                  예약 요청하기
                </Link>
                <Link
                  href="/chat"
                  className="w-full py-3 border border-orange-200 text-stone-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                >
                  <MessageCircle size={20} />
                  채팅 문의
                </Link>

                <div className="flex items-center gap-2 mt-4 p-3 bg-orange-50 rounded-lg">
                  <Shield size={16} className="text-orange-500" />
                  <span className="text-xs text-gray-500">
                    안전 에스크로 결제
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
