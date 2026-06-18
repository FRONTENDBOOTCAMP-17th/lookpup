"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import KakaoMap from "@/components/KakaoMap";
import BackButton from "@/components/common/BackButton";
import Pill from "@/components/ui/Pill";
import { MapPin, ChevronLeft } from "lucide-react";
import StarRow from "@/components/ui/StarRow";
import StatGrid from "@/components/ui/StatGrid";
import { supabase } from "@/lib/supabase";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  walk:   "산책",
  care:   "방문돌봄",
  hotel:  "위탁돌봄",
  pickup: "픽업",
};

const SERVICE_TYPE_UNIT: Record<string, string> = {
  walk:   "1시간",
  care:   "1일",
  hotel:  "1일",
  pickup: "1회",
};

interface ServiceRow {
  service_type: string;
  title: string | null;
  description: string | null;
  price: number;
  animal_type: string | null;
}

interface SitterDetail {
  id: string;
  full_name: string | null;
  profile_image: string | null;
  is_verified: boolean;
  introduction: string | null;
  career: string | null;
  available_area: string | null;
  latitude: number | null;
  longitude: number | null;
  base_price: number | null;
  rating: number;
  services: ServiceRow[];
}

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_LAT = 37.4979;
const DEFAULT_LNG = 127.0276;

export default function PetsitterProfilePage() {
  const params = useParams();
  const sitterId = params.id as string;

  const [sitter, setSitter] = useState<SitterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("소개");

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_petsitter_detail", {
        p_sitter_id: sitterId,
      });
      if (!error && data) {
        setSitter(data as SitterDetail);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [sitterId]);

  // 서비스 목록에서 표시용 레이블 도출
  const serviceLabels = sitter
    ? [...new Set(sitter.services.map((sv) => SERVICE_TYPE_LABEL[sv.service_type] ?? sv.service_type))]
    : [];

  // 활동 지역 텍스트
  const areaText = sitter?.available_area ?? "-";

  // 통계
  const stats = [
    { label: "경력", value: sitter?.career ?? "-" },
    { label: "완료", value: "-" },
  ];

  // 지도 좌표
  const lat = sitter?.latitude ?? DEFAULT_LAT;
  const lng = sitter?.longitude ?? DEFAULT_LNG;

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          불러오는 중...
        </div>
      );
    }
    if (!sitter) {
      return (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          펫시터 정보를 찾을 수 없습니다.
        </div>
      );
    }

    return (
      <>
        {/* 소개 탭 */}
        {activeTab === "소개" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
              <h3 className="font-bold text-stone-900 mb-4">소개</h3>
              <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
                {sitter.introduction ?? "소개글이 없습니다."}
              </p>
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
            {sitter.services.length === 0 ? (
              <p className="text-gray-400 text-sm">등록된 서비스가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {sitter.services.map((sv, idx) => {
                  const label = SERVICE_TYPE_LABEL[sv.service_type] ?? sv.service_type;
                  const unit = SERVICE_TYPE_UNIT[sv.service_type] ?? "1회";
                  return (
                    <div
                      key={idx}
                      className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-stone-900">
                          {sv.title ?? `${label} (${unit})`}
                        </span>
                        {sv.description && (
                          <p className="text-xs text-gray-500 mt-1">{sv.description}</p>
                        )}
                      </div>
                      <span className="text-base font-bold text-orange-500 shrink-0">
                        {sv.price.toLocaleString()}원~
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 후기 탭 */}
        {activeTab === "후기" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-500 mb-1">
                    {Number(sitter.rating).toFixed(1)}
                  </p>
                  <div className="flex items-center gap-0.5 justify-center mb-1">
                    <StarRow size={14} />
                  </div>
                  <p className="text-xs text-gray-400">0개 리뷰</p>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <div key={r} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-6">{r}점</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: "0%" }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">0</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              아직 후기가 없습니다.
            </div>
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
                markers={[{ lat, lng, id: sitter.id }]}
                center={{ lat, lng }}
                level={5}
              />
            </div>
            <p className="mt-4 text-gray-500 text-sm flex items-center gap-1">
              <MapPin size={14} className="text-orange-500 shrink-0" />
              {areaText}
            </p>
          </div>
        )}
      </>
    );
  };

  const name = sitter?.full_name ?? "펫시터";
  const initial = name.charAt(0);
  const rating = Number(sitter?.rating ?? 0);

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
                <div className="w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4" />

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
                  <StarRow size={18} />
                  <span className="text-stone-900 text-lg font-bold ml-1">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">(0)</span>
                </div>

                <div className="flex gap-2 flex-wrap justify-center mb-6">
                  {serviceLabels.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>

                <StatGrid stats={stats} className="w-full mb-6" />

                <Link
                  href={`/petsitters/${sitterId}/book`}
                  className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center transition-colors"
                >
                  예약하기
                </Link>
              </div>
            </div>

            {/* 오른쪽: 모바일 통계 + 탭 영역 */}
            <div className="flex-1 min-w-0">
              {/* 모바일 전용: 별점 / 서비스 태그 / 통계 */}
              <div className="md:hidden bg-white">
                <div className="px-5 py-3 flex items-center gap-1.5">
                  <StarRow size={13} />
                  <span className="text-sm font-bold text-stone-900">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">(0)</span>
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

              {/* 탭 콘텐츠 */}
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
