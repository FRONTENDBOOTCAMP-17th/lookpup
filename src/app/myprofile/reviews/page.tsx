"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Edit2, Trash2, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";

interface Review {
  id: number;
  rating: number;
  author: string;
  target: string;
  date: string;
  text: string;
  photos?: string[];
}

type TabId = "written" | "received";

// 더미 데이터

const WRITTEN_REVIEWS: Review[] = [
  {
    id: 1,
    rating: 5,
    author: "김민수",
    target: "박지영 펫시터",
    date: "2026-05-28",
    text: "우리 강아지를 정말 잘 돌봐주셨어요! 산책도 꼼꼼히 해주시고, 사진도 많이 보내주셔서 안심하고 맡길 수 있었습니다. 다음에도 꼭 부탁드리고 싶어요.",
    photos: ["photo1.jpg", "photo2.jpg"],
  },
  {
    id: 2,
    rating: 4,
    author: "김민수",
    target: "이수진 펫시터",
    date: "2026-05-15",
    text: "전반적으로 만족스러웠습니다. 시간 약속도 잘 지키시고 반려동물을 사랑하시는 게 느껴졌어요.",
    photos: [],
  },
];

const RECEIVED_REVIEWS: Review[] = [
  {
    id: 3,
    rating: 5,
    author: "최유진",
    target: "김민수",
    date: "2026-05-25",
    text: "반려동물에 대한 애정이 느껴지는 좋은 보호자님이셨습니다. 상세한 설명 덕분에 돌보는 데 어려움이 없었어요!",
    photos: [],
  },
  {
    id: 4,
    rating: 5,
    author: "정민호",
    target: "김민수",
    date: "2026-05-10",
    text: "소통이 원활하시고 강아지 컨디션도 상세히 알려주셨습니다. 감사합니다!",
    photos: [],
  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: "written", label: "작성한 리뷰" },
  { id: "received", label: "받은 리뷰" },
];

// 별점 컴포넌트

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-[#D1D5DB]"
          }
        />
      ))}
    </div>
  );
}

// 리뷰 카드 컴포넌트

function ReviewCard({ review, isOwn }: { review: Review; isOwn: boolean }) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      {/* 상단: 작성자 정보 및 별점 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF0E8] rounded-full border border-[#FFE9D6] flex items-center justify-center shrink-0">
            <span className="text-[#E8742A] font-semibold">
              {isOwn ? review.target[0] : review.author[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[#281A0E]">
              {isOwn ? review.target : review.author}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {/* 리뷰 본문 */}
      <p className="text-sm text-[#281A0E] leading-relaxed mb-3">
        {review.text}
      </p>

      {/* 첨부 사진 */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.photos.map((_, idx) => (
            <div
              key={idx}
              className="w-20 h-20 rounded-xl bg-[#FFF8F3] border border-[#FFE9D6] flex items-center justify-center"
            >
              <span className="text-xs text-[#6B7280]">사진 {idx + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* 내가 작성한 리뷰: 수정/삭제 버튼 */}
      {isOwn && (
        <div className="flex gap-2 pt-4 border-t border-[#FFE9D6]">
          <button className="flex-1 h-9 rounded-xl border border-[#FFE9D6] text-sm font-medium text-[#E8742A] hover:border-[#E8742A] transition-colors flex items-center justify-center gap-1.5">
            <Edit2 size={13} /> 수정
          </button>
          <button className="flex-1 h-9 rounded-xl border border-[#FFE9D6] text-sm font-medium text-[#E8742A] hover:border-[#E8742A] transition-colors flex items-center justify-center gap-1.5">
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      )}
    </div>
  );
}

// 페이지

export default function ReviewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("written");

  const reviews = activeTab === "written" ? WRITTEN_REVIEWS : RECEIVED_REVIEWS;

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
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
          <span className="flex-1 font-semibold text-[#281A0E]">후기 관리</span>
        </div>
      </div>

      <div className="w-full max-w-200 mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">후기 관리</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              작성한 리뷰와 받은 리뷰를 확인하세요
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white border border-[#FFE9D6] rounded-2xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#E8742A] text-white"
                  : "text-[#E8742A] hover:text-[#D4621A]"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs ${activeTab === tab.id ? "text-white/80" : "text-[#E8742A]/70"}`}
              >
                {
                  (tab.id === "written" ? WRITTEN_REVIEWS : RECEIVED_REVIEWS)
                    .length
                }
              </span>
            </button>
          ))}
        </div>

        {/* 리뷰 목록 */}
        {reviews.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-4">
              <Star size={28} className="text-[#FFD4AE]" />
            </div>
            <p className="font-semibold text-[#281A0E] mb-1">
              {activeTab === "written"
                ? "작성한 리뷰가 없어요"
                : "받은 리뷰가 없어요"}
            </p>
            <p className="text-sm text-[#6B7280] mb-6">
              {activeTab === "written"
                ? "서비스를 이용하고 리뷰를 남겨보세요"
                : "펫시터로 활동하면 리뷰를 받을 수 있어요"}
            </p>
            {activeTab === "written" && (
              <Link
                href="/search"
                className="px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
              >
                펫시터 찾기
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwn={activeTab === "written"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
