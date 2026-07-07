"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LoadingPage from "@/components/common/LoadingPage";
import BackButton from "@/components/common/BackButton";
import Pill from "@/components/ui/Pill";
import { MapPin, ChevronLeft } from "lucide-react";
import StarRow from "@/components/ui/StarRow";
import StatGrid from "@/components/ui/StatGrid";
import { useSitterDetail } from "@/hooks/queries/useSitterDetail";
import { useSitterReviews } from "@/hooks/queries/useSitterReviews";
import SitterIntroTab from "./SitterIntroTab";
import SitterServiceTab from "./SitterServiceTab";
import SitterReviewTab from "./SitterReviewTab";
import SitterLocationTab from "./SitterLocationTab";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

export default function SitterDetailClient({
  sitterId,
  from,
  roomId,
}: {
  sitterId: string;
  from?: string;
  roomId?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("소개");

  const isFromChat = from === "chat" && !!roomId;
  const backHref = isFromChat ? `/chat?roomId=${roomId}` : "/petsitters";
  const backLabel = isFromChat ? "채팅으로" : "목록으로";

  const { data: sitter, isLoading, isError } = useSitterDetail(sitterId);
  const { data: reviews = [] } = useSitterReviews(sitterId);

  const isSelf = !!sitter?.is_self;

  const serviceLabels = sitter
    ? [
        ...new Set(
          sitter.services.map(
            (sv) => SERVICE_TYPE_LABEL[sv.service_type] ?? sv.service_type,
          ),
        ),
      ]
    : [];

  const areaText = sitter?.display_area ?? sitter?.available_area ?? "-";
  const stats = [
    { label: "경력", value: sitter?.career ? "경력 있음" : "-" },
    { label: "완료", value: "-" },
  ];

  const name = sitter?.full_name ?? "펫시터";
  const rating = Number(sitter?.rating ?? 0);
  const reviewCount = sitter?.review_count ?? reviews.length;

  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingPage />;
    }
    if (isError || !sitter) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-gray-400 text-sm">펫시터 정보를 찾을 수 없습니다.</p>
          <Link href={backHref} className="text-orange-500 text-sm underline underline-offset-2">
            {isFromChat ? "채팅으로 돌아가기" : "목록으로 돌아가기"}
          </Link>
        </div>
      );
    }

    return (
      <>
        {activeTab === "소개" && <SitterIntroTab sitter={sitter} />}
        {activeTab === "서비스" && <SitterServiceTab services={sitter.services} />}
        {activeTab === "후기" && (
          <SitterReviewTab
            reviews={reviews}
            rating={rating}
            reviewCount={reviewCount}
          />
        )}
        {activeTab === "위치" && (
          <SitterLocationTab
            lat={sitter.latitude}
            lng={sitter.longitude}
            sitterId={sitter.id}
            areaText={areaText}
          />
        )}
      </>
    );
  };

  return (
    <>
      <Header />

      <div className="hidden md:block bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-12">
          <BackButton href={backHref} label={backLabel} className="mb-6" />
        </div>
      </div>

      <div className="bg-orange-50">
        <div className="md:max-w-7xl md:mx-auto md:px-10 md:pb-12">
          <div className="md:flex md:gap-8 md:items-start">
            <div className="md:w-85.25 md:shrink-0">
              {/* 모바일 이미지 헤더 */}
              <div
                className="md:hidden relative w-full h-44 bg-linear-to-br from-gray-100 to-gray-200"
                style={
                  sitter?.profile_image
                    ? {
                        backgroundImage: `url(${sitter.profile_image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <Link
                  href={backHref}
                  aria-label={isFromChat ? "채팅으로 돌아가기" : "펫시터 목록으로 돌아가기"}
                  className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft size={20} className="text-stone-900" aria-hidden="true" />
                </Link>
                <div
                  className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl font-bold text-white">{name}</h2>
                    {sitter?.is_verified && (
                      <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">
                        인증
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/80">
                    <MapPin size={11} aria-hidden="true" />
                    <span className="text-sm">{areaText}</span>
                  </div>
                </div>
              </div>

              {/* 데스크톱 프로필 카드 */}
              <div className="hidden md:flex flex-col items-center bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
                {sitter?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sitter.profile_image}
                    alt={`${name} 프로필`}
                    className="w-full aspect-square rounded-xl object-cover mb-4"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4" />
                )}

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-stone-900 text-2xl font-bold">{name}</span>
                  {sitter?.is_verified && (
                    <span className="px-2 py-1 bg-orange-500 rounded-md text-white text-xs font-medium">
                      인증
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1 text-gray-500 mb-3">
                  <MapPin size={14} />
                  <span className="text-sm">{areaText}</span>
                </div>

                <div className="flex items-center justify-center gap-1 mb-4">
                  <StarRow size={18} count={Math.round(rating)} />
                  <span className="text-stone-900 text-lg font-bold ml-1">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">({reviewCount})</span>
                </div>

                <div className="flex gap-2 flex-wrap justify-center mb-6">
                  {serviceLabels.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>

                <StatGrid stats={stats} className="w-full mb-6" />

                {isSelf ? (
                  <div className="w-full h-13 bg-gray-200 text-gray-400 text-base font-semibold rounded-[10px] flex items-center justify-center cursor-not-allowed">
                    본인 프로필입니다
                  </div>
                ) : (
                  <Link
                    href={`/petsitters/${sitterId}/book`}
                    className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center transition-colors"
                  >
                    예약하기
                  </Link>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* 모바일 전용: 별점 / 서비스 태그 / 통계 */}
              <div className="md:hidden bg-white">
                <div className="px-5 py-3 flex items-center gap-1.5">
                  <StarRow size={13} count={Math.round(rating)} />
                  <span className="text-sm font-bold text-stone-900">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">({reviewCount})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                  {serviceLabels.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>
                <StatGrid stats={stats} className="px-5 pb-5" />
              </div>

              {/* 탭 바 */}
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

              <div className="px-5 md:px-0 py-5 pb-24 md:pb-0">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 예약하기 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white border-t border-orange-100 px-5 py-3">
        {isSelf ? (
          <div className="block w-full py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-xl text-sm text-center cursor-not-allowed">
            본인 프로필입니다
          </div>
        ) : (
          <Link
            href={`/petsitters/${sitterId}/book`}
            className="block w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl text-sm text-center hover:bg-orange-600 transition-colors"
          >
            예약하기
          </Link>
        )}
      </div>

      <Footer />
    </>
  );
}
