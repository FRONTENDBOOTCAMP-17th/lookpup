"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import KakaoMap from "@/components/KakaoMap";
import Pill from "@/components/ui/Pill";
import { MapPin, ChevronLeft, Eye } from "lucide-react";
import StarRow from "@/components/ui/StarRow";
import StatGrid from "@/components/ui/StatGrid";
import { useUserStore } from "@/store/userStore";
import { getSitterServices } from "@/app/actions/sitters";

const REQUEST_TYPE_LABEL: Record<string, string> = {
  visit: "방문돌봄",
  foster: "위탁돌봄",
  walk: "산책",
  hotel: "호텔",
};

const ANIMAL_LABEL: Record<string, string> = {
  small_dog: "강아지 소형",
  medium_dog: "강아지 중형",
  large_dog: "강아지 대형",
  cat: "고양이",
};

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

interface ServiceDetail {
  title: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

export default function SitterProfilePreviewPage() {
  const router = useRouter();
  const { user, sitter } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("소개");
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);

  useEffect(() => {
    if (!sitter?.id) return;
    getSitterServices(sitter.id).then(({ data }) =>
      setServiceDetails(data.filter((s) => s.is_active))
    );
  }, [sitter?.id]);

  if (!user || !sitter) return null;

  const stats = [
    { label: "경력", value: sitter.career ?? "-" },
    { label: "완료", value: `${sitter.reviewCount}건` },
  ];

  const renderTabContent = () => (
    <>
      {activeTab === "소개" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <h3 className="font-bold text-stone-900 mb-4">소개</h3>
            <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
              {sitter.introduction ?? "소개글이 없습니다."}
            </p>
          </div>

          {sitter.availableAnimals.length > 0 && (
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
              <h3 className="font-bold text-stone-900 mb-4">돌봄 가능</h3>
              <div className="flex gap-2 flex-wrap">
                {sitter.availableAnimals.map((animal) => (
                  <Pill key={animal}>{ANIMAL_LABEL[animal] ?? animal}</Pill>
                ))}
              </div>
            </div>
          )}

          {sitter.requestType.length > 0 && (
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
              <h3 className="font-bold text-stone-900 mb-4">제공 서비스 유형</h3>
              <div className="flex gap-2 flex-wrap">
                {sitter.requestType.map((type) => (
                  <Pill key={type}>{REQUEST_TYPE_LABEL[type] ?? type}</Pill>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
            <h3 className="font-bold text-stone-900 mb-4">활동 사진</h3>
            {sitter.activityPhotoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {sitter.activityPhotoUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image src={url} alt={`활동 사진 ${idx + 1}`} fill className="object-cover" sizes="200px" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">등록된 활동 사진이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "서비스" && (
        <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
          <h3 className="font-bold text-stone-900 mb-4">제공 서비스</h3>
          {serviceDetails.length > 0 ? (
            <div className="flex flex-col gap-3">
              {serviceDetails.map((sv, idx) => (
                <div key={idx} className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-stone-900">{sv.title}</span>
                    {sv.description && (
                      <p className="text-xs text-gray-500 mt-1">{sv.description}</p>
                    )}
                  </div>
                  <span className="text-base font-bold text-orange-500 shrink-0">
                    {sv.price.toLocaleString()}원~
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 서비스가 없습니다.</p>
          )}
        </div>
      )}

      {activeTab === "후기" && (
        <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-orange-500 mb-2">{sitter.rating.toFixed(1)}</p>
            <div className="flex justify-center gap-0.5">
              <StarRow size={16} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{sitter.reviewCount}개 리뷰</p>
          </div>
        </div>
      )}

      {activeTab === "위치" && (
        <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5">
          <h3 className="text-stone-900 text-lg font-semibold mb-4">활동 지역</h3>
          {sitter.latitude && sitter.longitude ? (
            <div className="h-100 rounded-xl overflow-hidden">
              <KakaoMap
                markers={[{ lat: sitter.latitude, lng: sitter.longitude, id: 1, certified: user.isVerified }]}
                center={{ lat: sitter.latitude, lng: sitter.longitude }}
                level={5}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">위치 정보가 없습니다.</p>
          )}
          <p className="mt-4 text-gray-500 text-sm flex items-center gap-1">
            <MapPin size={14} className="text-orange-500 shrink-0" />
            {sitter.displayArea ?? sitter.availableArea}
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      <Header />

      {/* 모바일 */}
      <div className="md:hidden flex flex-col bg-orange-50">
        <div className="px-5 pt-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-5">
          <SitterProfileCard />
        </div>

        <div className="bg-orange-50 border-b border-orange-100 px-5 sticky top-16 z-10">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? "text-orange-500" : "text-gray-400"}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 py-5 pb-24">{renderTabContent()}</div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 px-5 py-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500/10 border border-orange-200 rounded-xl">
            <Eye size={15} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-600 flex-1">이 페이지는 보호자에게 보이는 내 프로필 미리보기입니다.</p>
          </div>
        </div>
      </div>

      {/* 데스크톱 */}
      <main className="hidden md:flex flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-12 w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors w-fit mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-base">뒤로 가기</span>
          </button>

          <div className="flex items-center gap-3 mb-8 px-4 py-3 bg-orange-500/10 border border-orange-200 rounded-xl">
            <Eye size={16} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-600">이 페이지는 보호자에게 보이는 내 프로필 미리보기입니다.</p>
          </div>

          <div className="flex gap-8 items-start">
            <div className="w-85.25 shrink-0 bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col items-center">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-linear-to-br from-gray-100 to-gray-200">
                {user.profileImage && (
                  <Image src={user.profileImage} alt={user.fullName} fill className="object-cover" sizes="342px" />
                )}
                {!user.profileImage && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar initial={user.fullName.charAt(0)} size="2xl" variant="orange" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-stone-900 text-2xl font-bold">{user.fullName}</span>
                {user.isVerified && (
                  <span className="px-2 py-1 bg-orange-500 rounded-md text-white text-xs font-medium">인증</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 text-gray-500 mb-3">
                <MapPin size={14} />
                <span className="text-sm">{sitter.availableArea}</span>
              </div>

              <div className="flex items-center justify-center gap-1 mb-4">
                <StarRow size={18} />
                <span className="text-stone-900 text-lg font-bold ml-1">{sitter.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({sitter.reviewCount})</span>
              </div>

              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {sitter.services.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>

              <StatGrid stats={stats} className="w-full" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="border-b border-orange-100 flex gap-8 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-semibold relative transition-colors ${activeTab === tab ? "text-orange-500" : "text-gray-500 hover:text-stone-900"}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
