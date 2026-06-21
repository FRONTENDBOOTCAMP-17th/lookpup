"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Trash2, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import { deleteReview } from "@/app/actions/reviews";
import { CustomModal } from "@/components/common/CustomModal";

interface WrittenReview {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  sitter_full_name: string;
  sitter_profile_image: string | null;
}

interface ReceivedReview {
  id: string;
  owner_id: string;
  owner_full_name: string;
  owner_profile_image: string | null;
  rating: number;
  content: string;
  created_at: string;
}

type TabId = "written" | "received";

const TABS: { id: TabId; label: string }[] = [
  { id: "written", label: "작성한 후기" },
  { id: "received", label: "받은 후기" },
];

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

function WrittenReviewCard({
  review,
  onDelete,
}: {
  review: WrittenReview;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    const result = await deleteReview(review.id);
    if ("error" in result && result.error) {
      setErrorMessage(result.error.message);
      setIsDeleting(false);
    } else {
      onDelete(review.id);
    }
  };

  return (
    <>
      <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              initial={review.sitter_full_name?.charAt(0) ?? "?"}
              src={review.sitter_profile_image}
            />
            <div>
              <p className="font-semibold text-[#281A0E]">
                {review.sitter_full_name}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {new Date(review.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
        <p className="text-sm text-[#281A0E] leading-relaxed mb-3">
          {review.content}
        </p>
        <div className="flex gap-2 pt-4 border-t border-[#FFE9D6]">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-xl border border-[#FFE9D6] text-sm font-medium text-[#E8742A] hover:border-[#E8742A] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={13} /> {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>

      <CustomModal
        open={showDeleteModal}
        type="danger"
        title="후기를 삭제하시겠습니까?"
        description="삭제한 후기는 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제하기"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />

      <CustomModal
        open={errorMessage !== null}
        type="error"
        title="삭제에 실패했습니다."
        description={errorMessage ?? ""}
        confirmText="확인"
        onClose={() => setErrorMessage(null)}
        onConfirm={() => setErrorMessage(null)}
      />
    </>
  );
}

function ReceivedReviewCard({ review }: { review: ReceivedReview }) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            initial={review.owner_full_name?.charAt(0) ?? "?"}
            src={review.owner_profile_image}
          />
          <div>
            <p className="font-semibold text-[#281A0E]">
              {review.owner_full_name}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {new Date(review.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-[#281A0E] leading-relaxed">{review.content}</p>
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("written");
  const [sitterId, setSitterId] = useState<string | null | undefined>(
    undefined,
  );

  const writtenFetchedRef = useRef(false);
  const receivedFetchedRef = useRef(false);

  const [writtenReviews, setWrittenReviews] = useState<WrittenReview[] | null>(
    null,
  );
  const [receivedReviews, setReceivedReviews] = useState<
    ReceivedReview[] | null
  >(null);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedNextCursor, setReceivedNextCursor] = useState<string | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [writtenError, setWrittenError] = useState<string | null>(null);
  const [receivedError, setReceivedError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/users/me", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setSitterId(json.data?.sitter_id ?? null))
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError")
          setSitterId(null);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activeTab !== "written" || writtenFetchedRef.current) return;
    writtenFetchedRef.current = true;
    const controller = new AbortController();
    fetch("/api/reviews/myreview", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setWrittenError("후기를 불러오지 못했어요. 다시 시도해 주세요.");
          setWrittenReviews([]);
        } else {
          setWrittenReviews(json.data ?? []);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setWrittenError("후기를 불러오지 못했어요. 다시 시도해 주세요.");
          setWrittenReviews([]);
        }
      });
    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "received" || receivedFetchedRef.current) return;
    if (sitterId === undefined) return;

    receivedFetchedRef.current = true;

    if (sitterId === null) {
      setReceivedReviews([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/sitters/${sitterId}/reviews`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setReceivedError("후기를 불러오지 못했어요. 다시 시도해 주세요.");
          setReceivedReviews([]);
          return;
        }
        setReceivedReviews(json.data?.reviews ?? []);
        setReceivedTotal(json.data?.total ?? 0);
        setReceivedNextCursor(json.data?.next_cursor ?? null);
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setReceivedError("후기를 불러오지 못했어요. 다시 시도해 주세요.");
          setReceivedReviews([]);
        }
      });
    return () => controller.abort();
  }, [activeTab, sitterId]);

  const handleDeleteWritten = (id: string) => {
    setWrittenReviews((prev) => (prev ? prev.filter((r) => r.id !== id) : []));
  };

  const handleLoadMoreReceived = async () => {
    if (!sitterId || !receivedNextCursor || isLoadingMore) return;
    setLoadMoreError(null);
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/sitters/${sitterId}/reviews?cursor=${receivedNextCursor}`,
      );
      const json = await res.json();
      if (!json.error) {
        setReceivedReviews((prev) => [
          ...(prev ?? []),
          ...(json.data?.reviews ?? []),
        ]);
        setReceivedNextCursor(json.data?.next_cursor ?? null);
      } else {
        setLoadMoreError("더 보기를 불러오지 못했어요. 다시 시도해 주세요.");
      }
    } catch {
      setLoadMoreError("더 보기를 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const isLoading =
    activeTab === "written"
      ? writtenReviews === null
      : sitterId === undefined ||
        (sitterId !== null && receivedReviews === null);

  const writtenCount = writtenReviews?.length ?? 0;
  const receivedCount = receivedTotal;

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
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
              작성한 후기와 받은 후기를 확인하세요
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
                {tab.id === "written"
                  ? writtenReviews === null || writtenError
                    ? ""
                    : writtenCount
                  : receivedReviews === null || receivedError
                    ? ""
                    : receivedCount}
              </span>
            </button>
          ))}
        </div>

        {/* 후기 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#E8742A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "written" ? (
          writtenReviews !== null &&
          (writtenError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-semibold text-[#281A0E] mb-1">
                오류가 발생했어요
              </p>
              <p className="text-sm text-[#6B7280] mb-6">{writtenError}</p>
              <button
                onClick={() => {
                  writtenFetchedRef.current = false;
                  setWrittenError(null);
                  setWrittenReviews(null);
                }}
                className="px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : writtenReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-4">
                <Star size={28} className="text-[#FFD4AE]" />
              </div>
              <p className="font-semibold text-[#281A0E] mb-1">
                작성한 후기가 없어요
              </p>
              <p className="text-sm text-[#6B7280] mb-6">
                서비스를 이용하고 후기를 남겨보세요
              </p>
              <Link
                href="/petsitters"
                className="px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
              >
                펫시터 찾기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {writtenReviews.map((review) => (
                <WrittenReviewCard
                  key={review.id}
                  review={review}
                  onDelete={handleDeleteWritten}
                />
              ))}
            </div>
          ))
        ) : (
          receivedReviews !== null &&
          (receivedError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-semibold text-[#281A0E] mb-1">
                오류가 발생했어요
              </p>
              <p className="text-sm text-[#6B7280] mb-6">{receivedError}</p>
              <button
                onClick={() => {
                  receivedFetchedRef.current = false;
                  setReceivedError(null);
                  setReceivedReviews(null);
                }}
                className="px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : receivedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-4">
                <Star size={28} className="text-[#FFD4AE]" />
              </div>
              <p className="font-semibold text-[#281A0E] mb-1">
                받은 후기가 없어요
              </p>
              <p className="text-sm text-[#6B7280]">
                펫시터로 활동하면 후기를 받을 수 있어요
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {receivedReviews.map((review) => (
                <ReceivedReviewCard key={review.id} review={review} />
              ))}
              {loadMoreError && (
                <p className="text-center text-sm text-red-500">
                  {loadMoreError}
                </p>
              )}
              {receivedNextCursor && (
                <button
                  onClick={handleLoadMoreReceived}
                  disabled={isLoadingMore}
                  className="w-full py-3 rounded-xl border border-[#FFCBA4] text-sm font-medium text-[#E8742A] hover:border-[#E8742A] transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
