"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Star,
  Camera,
  X,
  AlertCircle,
  PawPrint,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

// 상수

const RATING_LABELS: Record<number, string> = {
  1: "별로였어요",
  2: "그저 그랬어요",
  3: "괜찮았어요",
  4: "좋았어요",
  5: "최고였어요!",
};

const DETAIL_RATINGS = [
  "소통이 원활했어요",
  "약속을 잘 지켰어요",
  "반려동물을 잘 돌봐줬어요",
];

const QUICK_TAGS = [
  "친절해요",
  "꼼꼼해요",
  "시간을 잘 지켜요",
  "소통이 잘 돼요",
  "또 맡기고 싶어요",
  "반려동물을 좋아해요",
];

// 더미 데이터

const MOCK_BOOKING = {
  sitterName: "박지현",
  sitterInitial: "박",
  sitterAvatarColor: "#F5A468",
  serviceType: "방문돌봄",
  dateRange: "6월 14일 ~ 6월 16일",
  petName: "몽이",
  bookingId: "#BK-20240614",
};

// 후기 상태

interface ReviewState {
  overallRating: number;
  detailRatings: Record<string, number>;
  tags: string[];
  content: string;
}

// 별점 컴포넌트

function StarRating({
  value,
  onChange,
  starSize,
  gap = 8,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  starSize: number;
  gap?: number;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  const display = readOnly ? value : hovered || value;

  return (
    <div className="flex" style={{ gap }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHovered(i)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange?.(i)}
          className={`transition-transform ${
            !readOnly
              ? "hover:scale-110 active:scale-95 cursor-pointer"
              : "cursor-default"
          }`}
          style={{ padding: 0, background: "none", border: "none" }}
        >
          <Star
            size={starSize}
            fill={i <= display ? "#F5A623" : "none"}
            stroke={i <= display ? "#F5A623" : "#FFE9D6"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// 세부 평가 행 컴포넌트

function DetailRatingRow({
  label,
  value,
  onChange,
  starSize = 24,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  starSize?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#281A0E]">{label}</span>
      <StarRating
        value={value}
        onChange={onChange}
        starSize={starSize}
        gap={4}
      />
    </div>
  );
}

// 사진 업로드 슬롯 그리드 컴포넌트

function PhotoUploadSlots({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 5,
  columns = 4,
  slotWidth = 129,
  slotHeight = 136,
}: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
  maxPhotos?: number;
  columns?: number;
  slotWidth?: number;
  slotHeight?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd(URL.createObjectURL(file));
    e.target.value = "";
  };

  const canAdd = photos.length < maxPhotos;
  const emptySlots = Math.max(0, maxPhotos - photos.length);

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, ${slotWidth}px)` }}
    >
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => canAdd && fileRef.current?.click()}
        style={{ width: slotWidth, height: slotHeight }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
          canAdd
            ? "border-[#FFE9D6] hover:border-[#E8742A]/60 hover:bg-[#FFF8F3] cursor-pointer"
            : "border-[#FFE9D6] opacity-40 cursor-not-allowed"
        }`}
      >
        <Camera size={28} className="text-[#E8742A]" />
        <span className="text-xs text-[#6B7280]">사진 추가</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {photos.map((url, idx) => (
        <div
          key={idx}
          className="relative rounded-xl overflow-hidden border border-[#FFE9D6]"
          style={{ width: slotWidth, height: slotHeight }}
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
          >
            <X size={11} className="text-[#281A0E]" />
          </button>
        </div>
      ))}

      {Array.from({ length: emptySlots }).map((_, idx) => (
        <div
          key={`empty-${idx}`}
          style={{ width: slotWidth, height: slotHeight }}
          className="rounded-xl border-2 border-dashed border-[#FFE9D6] bg-[#FFF8F3]"
        />
      ))}
    </div>
  );
}

// 사진 업로드 래핑 그리드 컴포넌트 (모바일)

function PhotoUploadHScroll({
  photos,
  onAdd,
  onRemove,
}: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd(URL.createObjectURL(file));
    e.target.value = "";
  };

  const canAdd = photos.length < 5;
  const emptySlots = Math.max(0, 5 - photos.length);

  return (
    <div className="flex flex-wrap gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* 업로드 버튼 */}
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => canAdd && fileRef.current?.click()}
        className="relative w-[calc((100%-24px)/3)] rounded-xl border-2 border-dashed border-[#FFE9D6] bg-white hover:border-[#E8742A]/60 hover:bg-[#FFF8F3] transition-all overflow-hidden"
      >
        <div className="pb-[100%]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Camera size={24} className="text-[#E8742A]" />
          <span className="text-xs text-[#6B7280]">사진 추가</span>
        </div>
      </button>

      {/* 업로드된 사진 */}
      {photos.map((url, idx) => (
        <div
          key={idx}
          className="relative w-[calc((100%-24px)/3)] rounded-xl overflow-hidden border border-[#FFE9D6]"
        >
          <div className="pb-[100%]" />
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <button
            onClick={() => onRemove(idx)}
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow z-10"
          >
            <X size={10} className="text-[#281A0E]" />
          </button>
        </div>
      ))}

      {/* 빈 슬롯 */}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`e${i}`}
          className="relative w-[calc((100%-24px)/3)] rounded-xl border-2 border-dashed border-[#FFE9D6] bg-[#FFF8F3]"
        >
          <div className="pb-[100%]" />
        </div>
      ))}
    </div>
  );
}

// 데스크탑 / 태블릿 뷰

function DesktopReviewView({
  reviewData,
  setReviewData,
  photos,
  onAddPhoto,
  onRemovePhoto,
  onSubmit,
}: {
  reviewData: ReviewState;
  setReviewData: React.Dispatch<React.SetStateAction<ReviewState>>;
  photos: string[];
  onAddPhoto: (url: string) => void;
  onRemovePhoto: (idx: number) => void;
  onSubmit: () => void;
}) {
  const toggleTag = (tag: string) => {
    setReviewData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const setDetailRating = (label: string, val: number) => {
    setReviewData((prev) => ({
      ...prev,
      detailRatings: { ...prev.detailRatings, [label]: val },
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 예약 요약 카드 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-5 flex items-center gap-5">
        {/* 아바타 및 인증 뱃지 */}
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
            style={{ background: MOCK_BOOKING.sitterAvatarColor }}
          >
            {MOCK_BOOKING.sitterInitial}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#E8742A] rounded-full flex items-center justify-center shadow">
            <BadgeCheck size={12} className="text-white" />
          </div>
        </div>

        {/* 중앙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#281A0E]">
              {MOCK_BOOKING.sitterName}
            </span>
            <span className="text-sm text-[#6B7280]">펫시터</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#E8742A] font-medium">
              {MOCK_BOOKING.serviceType}
            </span>
            <span className="text-sm text-[#6B7280]">
              {MOCK_BOOKING.dateRange}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <PawPrint size={13} className="text-[#E8742A]" />
            <span className="text-sm text-[#281A0E] font-medium">
              {MOCK_BOOKING.petName}
            </span>
          </div>
        </div>

        {/* 예약 번호 */}
        <span className="text-xs text-[#6B7280] shrink-0 self-start pt-1">
          {MOCK_BOOKING.bookingId}
        </span>
      </div>

      {/* 별점 섹션 카드 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-7">
        {/* 전반적인 만족도 */}
        <div className="flex flex-col items-center mb-6">
          <h3 className="font-semibold text-[#281A0E] mb-5 text-center">
            전반적인 만족도
          </h3>
          <StarRating
            value={reviewData.overallRating}
            onChange={(v) => setReviewData((p) => ({ ...p, overallRating: v }))}
            starSize={48}
            gap={10}
          />
          <div className="h-7 mt-3 flex items-center justify-center">
            {reviewData.overallRating > 0 && (
              <span className="text-base font-semibold text-[#E8742A] transition-all">
                {RATING_LABELS[reviewData.overallRating]}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-[#FFE9D6] my-2" />

        {/* 세부 평가 */}
        <div className="pt-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-[#6B7280]">
              세부 평가
            </span>
            <span className="text-xs px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#6B7280]">
              선택
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {DETAIL_RATINGS.map((label) => (
              <DetailRatingRow
                key={label}
                label={label}
                value={reviewData.detailRatings[label] ?? 0}
                onChange={(v) => setDetailRating(label, v)}
                starSize={24}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 후기 내용 카드 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-7">
        <h3 className="font-semibold text-[#281A0E] mb-1">후기 내용</h3>
        <p className="text-sm text-[#6B7280] mb-5">
          최소 10자 이상 작성해주세요
        </p>

        {/* 빠른 태그 */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[#281A0E] mb-3">
            이런 점이 좋았어요
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  reviewData.tags.includes(tag)
                    ? "bg-[#E8742A] text-white border-[#E8742A]"
                    : "bg-[#FFF8F3] text-[#6B7280] border-[#FFE9D6] hover:border-[#E8742A]/40"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div>
          <div className="flex justify-end mb-1">
            <span className="text-xs text-[#6B7280]">
              {reviewData.content.length} / 1000
            </span>
          </div>
          <textarea
            value={reviewData.content}
            onChange={(e) =>
              e.target.value.length <= 1000 &&
              setReviewData((p) => ({ ...p, content: e.target.value }))
            }
            placeholder={
              "펫시터와의 경험을 자세히 공유해주세요.\n예) 몽이가 낯을 많이 가리는데 잘 적응할 수 있게 도와주셨어요 :)"
            }
            className="w-full px-4 py-3 border border-[#FFE9D6] rounded-xl text-[#281A0E] placeholder-[#6B7280] focus:outline-none focus:border-[#E8742A] transition-colors resize-none"
            style={{ minHeight: 160 }}
          />
        </div>
      </div>

      {/* 사진 첨부 카드 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-7">
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-semibold text-[#281A0E]">사진 첨부</h3>
          <span className="text-xs px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#6B7280]">
            선택
          </span>
          <span className="ml-auto text-xs text-[#6B7280]">최대 5장</span>
        </div>

        <PhotoUploadSlots
          photos={photos}
          onAdd={onAddPhoto}
          onRemove={onRemovePhoto}
          maxPhotos={5}
          columns={4}
          slotWidth={129}
          slotHeight={136}
        />
      </div>

      {/* 안내 문구 */}
      <div className="flex items-center justify-center gap-2 py-2">
        <AlertCircle size={16} className="text-[#F5A623] shrink-0" />
        <p className="text-sm text-[#6B7280] text-center">
          후기는 작성 후 수정이 불가합니다. 신중하게 작성해주세요
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-3 pb-4">
        {/* 후기 등록 기능 모달 */}
        <button
          type="button"
          onClick={onSubmit}
          className="w-full h-14 rounded-xl bg-[#E8742A] text-white font-semibold text-base hover:bg-[#D4621A] transition-colors shadow-sm"
        >
          후기 등록하기
        </button>
        <button
          type="button"
          className="w-full h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 hover:text-[#E8742A] transition-colors"
        >
          나중에 작성하기
        </button>
      </div>
    </div>
  );
}

// 모바일 화면 1: 별점 & 태그

function MobileScreen1({
  reviewData,
  setReviewData,
  onNext,
}: {
  reviewData: ReviewState;
  setReviewData: React.Dispatch<React.SetStateAction<ReviewState>>;
  onNext: () => void;
}) {
  const toggleTag = (tag: string) =>
    setReviewData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));

  const setDetailRating = (label: string, val: number) =>
    setReviewData((prev) => ({
      ...prev,
      detailRatings: { ...prev.detailRatings, [label]: val },
    }));

  const canProceed = reviewData.overallRating > 0;

  return (
    <div className="flex flex-col gap-4 pb-39">
      {/* 예약 요약 (컴팩트) */}
      <div className="bg-[#FFF8F3] rounded-xl p-3 flex items-center gap-3 border border-[#FFE9D6]">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: MOCK_BOOKING.sitterAvatarColor }}
        >
          {MOCK_BOOKING.sitterInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-[#281A0E]">
              {MOCK_BOOKING.sitterName}
            </span>
            <span className="text-xs px-2 py-0.5 bg-white border border-[#FFE9D6] rounded-full text-[#E8742A] font-medium">
              {MOCK_BOOKING.serviceType}
            </span>
          </div>
          <span className="text-xs text-[#6B7280]">
            {MOCK_BOOKING.dateRange}
          </span>
        </div>
      </div>

      {/* 전반적인 만족도 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 flex flex-col items-center">
        <p className="text-sm font-semibold text-[#281A0E] mb-4 text-center">
          전반적인 만족도
        </p>
        <StarRating
          value={reviewData.overallRating}
          onChange={(v) => setReviewData((p) => ({ ...p, overallRating: v }))}
          starSize={44}
          gap={8}
        />
        <div className="h-6 mt-3 flex items-center">
          {reviewData.overallRating > 0 && (
            <span className="text-sm font-semibold text-[#E8742A]">
              {RATING_LABELS[reviewData.overallRating]}
            </span>
          )}
        </div>
      </div>

      {/* 빠른 태그 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-5">
        <p className="text-sm font-semibold text-[#281A0E] mb-3">
          좋았던 점을 선택해주세요
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
                reviewData.tags.includes(tag)
                  ? "bg-[#E8742A] text-white border-[#E8742A]"
                  : "bg-[#FFF8F3] text-[#6B7280] border-[#FFE9D6]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 세부 평가 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-semibold text-[#281A0E]">세부 평가</p>
          <span className="text-xs px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#6B7280]">
            선택
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {DETAIL_RATINGS.map((label) => (
            <DetailRatingRow
              key={label}
              label={label}
              value={reviewData.detailRatings[label] ?? 0}
              onChange={(v) => setDetailRating(label, v)}
              starSize={20}
            />
          ))}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-18 left-0 right-0 bg-white border-t border-[#FFE9D6] px-5 py-4 z-40">
        <button
          suppressHydrationWarning
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="w-full h-13 rounded-xl bg-[#E8742A] text-white font-semibold text-base disabled:bg-[#FFE9D6] disabled:text-[#6B7280] transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}

// 모바일 화면 2: 텍스트 & 사진

function MobileScreen2({
  reviewData,
  setReviewData,
  photos,
  onAddPhoto,
  onRemovePhoto,
  onLater,
  onSubmit,
}: {
  reviewData: ReviewState;
  setReviewData: React.Dispatch<React.SetStateAction<ReviewState>>;
  photos: string[];
  onAddPhoto: (url: string) => void;
  onRemovePhoto: (idx: number) => void;
  onLater: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-50">
      {/* 후기 내용 카드 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#281A0E]">후기 내용</h3>
          <span className="text-xs text-[#6B7280]">
            {reviewData.content.length} / 1000
          </span>
        </div>
        <p className="text-xs text-[#6B7280] mb-3">
          최소 10자 이상 작성해주세요
        </p>
        <textarea
          value={reviewData.content}
          onChange={(e) =>
            e.target.value.length <= 1000 &&
            setReviewData((p) => ({ ...p, content: e.target.value }))
          }
          placeholder={
            "펫시터와의 경험을 자세히 공유해주세요.\n예) 몽이가 낯을 많이 가리는데 잘 적응할 수 있게 도와주셨어요 :)"
          }
          className="w-full px-4 py-3 border border-[#FFE9D6] rounded-xl text-[#281A0E] placeholder-[#6B7280] focus:outline-none focus:border-[#E8742A] transition-colors resize-none"
          style={{ minHeight: 180 }}
        />
      </div>

      {/* 사진 첨부 */}
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-[#281A0E]">사진 첨부</h3>
          <span className="text-xs px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#6B7280]">
            선택
          </span>
          <span className="ml-auto text-xs text-[#6B7280]">최대 5장</span>
        </div>
        <PhotoUploadHScroll
          photos={photos}
          onAdd={onAddPhoto}
          onRemove={onRemovePhoto}
        />
      </div>

      {/* 안내 문구 */}
      <div className="flex items-center gap-2 bg-[#FFFBF5] border border-[#FFE9D6] rounded-xl px-4 py-3">
        <AlertCircle size={15} className="text-[#F5A623] shrink-0" />
        <p className="text-xs text-[#6B7280]">후기는 수정이 불가합니다</p>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-18 left-0 right-0 bg-white border-t border-[#FFE9D6] px-5 py-4 z-40">
        <button
          type="button"
          onClick={onSubmit}
          className="w-full h-13 rounded-xl bg-[#E8742A] text-white font-semibold text-base mb-3 hover:bg-[#D4621A] transition-colors"
        >
          후기 등록하기
        </button>
        <button
          type="button"
          onClick={onLater}
          className="w-full text-sm text-[#6B7280] font-medium text-center hover:text-[#E8742A] transition-colors py-1"
        >
          나중에 작성하기
        </button>
      </div>
    </div>
  );
}

// 페이지

export default function ReviewWritePage() {
  const router = useRouter();
  const [mobileScreen, setMobileScreen] = useState<1 | 2>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewState>({
    overallRating: 0,
    detailRatings: {},
    tags: [],
    content: "",
  });

  const addPhoto = (url: string) =>
    setPhotos((prev) => (prev.length < 5 ? [...prev, url] : prev));
  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <div className="hidden lg:block">
        <Header />
      </div>
      <MobileHeader />

      {/* 데스크탑 콘텐츠 */}
      <div className="hidden lg:block w-full max-w-160 mx-auto px-4 pt-12 pb-20">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E] mb-0.5">
              후기를 남겨주세요
            </h2>
            <p className="text-sm text-[#6B7280]">
              솔직한 후기가 더 좋은 돌봄 문화를 만들어요
            </p>
          </div>
        </div>

        <DesktopReviewView
          reviewData={reviewData}
          setReviewData={setReviewData}
          photos={photos}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          onSubmit={() => setShowSubmitModal(true)}
        />
      </div>

      {/* 모바일 콘텐츠 */}
      <div className="lg:hidden px-5 pt-4">
        {/* 모바일 페이지 타이틀 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => (mobileScreen === 2 ? setMobileScreen(1) : router.back())}
            className="w-9 h-9 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={18} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#281A0E] leading-tight">
              후기를 남겨주세요
            </h2>
            <p className="text-xs text-[#6B7280]">
              솔직한 후기가 더 좋은 돌봄 문화를 만들어요
            </p>
          </div>
        </div>

        {mobileScreen === 1 ? (
          <MobileScreen1
            reviewData={reviewData}
            setReviewData={setReviewData}
            onNext={() => setMobileScreen(2)}
          />
        ) : (
          <MobileScreen2
            reviewData={reviewData}
            setReviewData={setReviewData}
            photos={photos}
            onAddPhoto={addPhoto}
            onRemovePhoto={removePhoto}
            onLater={() => router.back()}
            onSubmit={() => setShowSubmitModal(true)}
          />
        )}
      </div>

      {/* 후기 등록 기능 모달 */}
      <CustomModal
        open={showSubmitModal}
        preset="saveConfirm"
        title="후기를 등록하시겠습니까?"
        description="후기는 작성 후 수정이 불가합니다. 신중하게 확인해주세요."
        cancelText="취소"
        confirmText="등록하기"
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => {
          // TODO: 후기 등록 API 연동
          setShowSubmitModal(false);
          router.back();
        }}
      />

      <MobileBottomNav />
    </div>
  );
}
