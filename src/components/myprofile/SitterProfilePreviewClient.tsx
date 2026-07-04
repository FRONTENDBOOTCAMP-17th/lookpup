"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionCard from "@/components/common/SectionCard";
import Avatar from "@/components/ui/Avatar";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import KakaoMap from "@/components/KakaoMap";
import Pill from "@/components/ui/Pill";
import { MapPin, ChevronLeft, Eye } from "lucide-react";
import StarRow from "@/components/ui/StarRow";
import StatGrid from "@/components/ui/StatGrid";
import { useUserStore, type SitterData } from "@/store/userStore";
import { getSitterServices } from "@/app/actions/sitters";
import { useSitterReviews } from "@/hooks/queries/useSitterReviews";
import { ImageGallery, ImageLightbox } from "@/components/common/ImageGallery";

const TABS = ["소개", "서비스", "후기", "위치"] as const;
type Tab = (typeof TABS)[number];

interface ServiceDetail {
  title: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

export default function SitterProfilePreviewClient({
  initialSitter,
  initialServiceDetails,
}: {
  initialSitter?: SitterData | null;
  initialServiceDetails?: ServiceDetail[];
}) {
  const router = useRouter();
  const { user, sitter: storeSitter } = useUserStore();
  const sitter = storeSitter ?? initialSitter ?? null;
  const [activeTab, setActiveTab] = useState<Tab>("소개");
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>(
    initialServiceDetails ?? [],
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data: reviews = [] } = useSitterReviews(sitter?.id ?? "");

  useEffect(() => {
    if (initialServiceDetails !== undefined) return;
    if (!sitter?.id) return;
    getSitterServices(sitter.id).then(({ data }) =>
      setServiceDetails(data.filter((s) => s.is_active)),
    );
  }, [sitter?.id, initialServiceDetails]);

  if (!user || !sitter) return null;

  const stats = [
    { label: "경력", value: sitter.career ?? "-" },
    { label: "완료", value: `${sitter.reviewCount}건` },
  ];

  const areaText = sitter.displayArea ?? sitter.availableArea;

  const reviewCount = sitter.reviewCount ?? reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  const renderTabContent = () => (
    <>
      {activeTab === "소개" && (
        <div className="flex flex-col gap-4">
          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">소개</h3>
            <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
              {sitter.introduction ?? "소개글이 없습니다."}
            </p>
          </SectionCard>

          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">경력</h3>
            <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
              {sitter.career ?? "등록된 경력 정보가 없습니다."}
            </p>
          </SectionCard>

          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">사진</h3>
            {sitter.activityPhotoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {sitter.activityPhotoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="relative aspect-square rounded-lg overflow-hidden focus:outline-none"
                  >
                    <Image
                      src={url}
                      alt={`사진 ${idx + 1}`}
                      fill
                      className="object-cover hover:opacity-90 transition-opacity"
                      sizes="200px"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">등록된 사진이 없습니다.</p>
            )}
          </SectionCard>

          <ImageLightbox
            urls={sitter.activityPhotoUrls}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
          />
        </div>
      )}

      {activeTab === "서비스" && (
        <SectionCard className="p-6 gap-0">
          <h3 className="font-bold text-stone-900 mb-4">제공 서비스 및 가격</h3>
          {serviceDetails.length > 0 ? (
            <div className="flex flex-col gap-3">
              {serviceDetails.map((sv, idx) => (
                <div key={idx} className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-stone-900">{sv.title}</span>
                    {sv.description && <p className="text-xs text-gray-500 mt-1">{sv.description}</p>}
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
        </SectionCard>
      )}

      {activeTab === "후기" && (
        <div className="flex flex-col gap-4">
          <SectionCard className="p-6 gap-0">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-orange-500 mb-1">
                  {sitter.rating.toFixed(1)}
                </p>
                <div className="flex items-center gap-0.5 justify-center mb-1">
                  <StarRow size={14} count={Math.round(sitter.rating)} />
                </div>
                <p className="text-xs text-gray-400">{reviewCount}개 리뷰</p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {ratingCounts.map(({ r, count }) => (
                  <div key={r} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6">{r}점</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width:
                            reviewCount > 0
                              ? `${(count / reviewCount) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
          {reviews.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              아직 후기가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((rv) => (
                <SectionCard key={rv.id} className="p-5 gap-0">
                  <div className="flex items-center gap-3 mb-3">
                    {rv.owner?.profile_image ? (
                      <img
                        src={rv.owner.profile_image}
                        alt={rv.owner.full_name ?? "보호자"}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-sm font-bold">
                        {(rv.owner?.full_name ?? "?").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {rv.owner?.full_name ?? "보호자"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRow size={11} count={rv.rating} />
                        <span className="text-xs text-gray-400 ml-1">
                          {new Date(rv.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {rv.content}
                  </p>
                  {rv.image_urls && rv.image_urls.length > 0 && (
                    <div className="mt-3">
                      <ImageGallery urls={rv.image_urls} />
                    </div>
                  )}
                  {rv.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rv.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "위치" && (
        <SectionCard className="p-5 gap-0">
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
        </SectionCard>
      )}
    </>
  );

  return (
    <>
      <Header />

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

        <div className="bg-orange-50 border-b border-orange-100 px-5 sticky top-0 z-10">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? "text-orange-500" : "text-gray-400"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />}
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
            <SectionCard className="w-85.25 shrink-0 items-center gap-0">
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
                <span className="text-sm">{areaText}</span>
              </div>

              <div className="flex items-center justify-center gap-1 mb-4">
                <StarRow size={18} count={Math.round(sitter.rating)} />
                <span className="text-stone-900 text-lg font-bold ml-1">{sitter.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({sitter.reviewCount})</span>
              </div>

              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {sitter.services.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>

              <StatGrid stats={stats} className="w-full mb-6" />

              <div className="w-full h-13 bg-orange-500 text-white text-base font-semibold rounded-[10px] flex items-center justify-center">
                예약하기
              </div>
            </SectionCard>

            <div className="flex-1 min-w-0">
              <div className="border-b border-orange-100 flex gap-8 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-semibold relative transition-colors ${activeTab === tab ? "text-orange-500" : "text-gray-400 hover:text-stone-900"}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />}
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
