"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Trash2, ChevronLeft, Flag } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import { deleteReview } from "@/app/actions/reviews";
import { CustomModal } from "@/components/common/CustomModal";
import { ImageGallery } from "@/components/common/ImageGallery";

interface WrittenReview {
  id: string;
  rating: number;
  content: string;
  image_urls: string[];
  tags: string[];
  detail_ratings: Record<string, number>;
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
  image_urls: string[];
  tags: string[];
  detail_ratings: Record<string, number>;
  created_at: string;
}

type TabId = "written" | "received";

const TABS: { id: TabId; label: string }[] = [
  { id: "written", label: "작성한 후기" },
  { id: "received", label: "받은 후기" },
];


function MiniStarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={
            i <= value
              ? "fill-orange-400 text-orange-400"
              : "fill-orange-100 text-orange-100"
          }
        />
      ))}
    </div>
  );
}

function RatingBlock({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 shrink-0">
      <Star size={15} className="fill-orange-400 text-orange-400" />
      <span className="text-base font-bold text-orange-500 leading-none">
        {rating}.0
      </span>
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
      <div className="bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar
              initial={review.sitter_full_name?.charAt(0) ?? "?"}
              src={review.sitter_profile_image}
            />
            <div>
              <p className="font-semibold text-stone-900 text-sm">
                {review.sitter_full_name}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {new Date(review.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
          <RatingBlock rating={review.rating} />
        </div>

        {Object.keys(review.detail_ratings).length > 0 && (
          <div className="px-5 pb-4 border-t border-orange-100 pt-3 space-y-2">
            {Object.entries(review.detail_ratings).map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-stone-500">{label}</span>
                <MiniStarRating value={val} />
              </div>
            ))}
          </div>
        )}

        <div className="px-5 pt-4 border-t border-orange-100 space-y-3">
          {review.image_urls.length > 0 && (
            <ImageGallery urls={review.image_urls} />
          )}
          <p className="text-sm text-stone-900 leading-relaxed">
            {review.content}
          </p>
        </div>

        <div className="px-5 py-3 border-t border-orange-100 mt-4 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full border border-orange-200"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash2 size={12} /> {isDeleting ? "삭제 중..." : "삭제"}
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
    <div className="bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Avatar
            initial={review.owner_full_name?.charAt(0) ?? "?"}
            src={review.owner_profile_image}
          />
          <div>
            <p className="font-semibold text-stone-900 text-sm">
              {review.owner_full_name}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(review.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <RatingBlock rating={review.rating} />
      </div>

      {Object.keys(review.detail_ratings).length > 0 && (
        <div className="px-5 pb-4 border-t border-orange-100 pt-3 space-y-2">
          {Object.entries(review.detail_ratings).map(([label, val]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-stone-500">{label}</span>
              <MiniStarRating value={val} />
            </div>
          ))}
        </div>
      )}

      <div className="px-5 pt-4 pb-5 border-t border-orange-100 space-y-3">
        {review.image_urls.length > 0 && (
          <ImageGallery urls={review.image_urls} />
        )}
        <p className="text-sm text-stone-900 leading-relaxed">
          {review.content}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-orange-100 mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full border border-orange-200"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/myprofile/report?targetId=${review.owner_id}&targetName=${encodeURIComponent(review.owner_full_name)}${review.owner_profile_image ? `&targetImage=${encodeURIComponent(review.owner_profile_image)}` : ""}`}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition-colors shrink-0"
        >
          <Flag size={12} /> 신고
        </Link>
      </div>
    </div>
  );
}

export default function ReviewsClient({
  initialSitterId,
  initialWrittenReviews,
}: {
  initialSitterId?: string | null;
  initialWrittenReviews?: WrittenReview[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("written");
  const [sitterId, setSitterId] = useState<string | null | undefined>(
    initialSitterId !== undefined ? initialSitterId : undefined,
  );

  const writtenFetchedRef = useRef(initialWrittenReviews !== undefined);
  const receivedFetchedRef = useRef(false);

  const [writtenReviews, setWrittenReviews] = useState<WrittenReview[] | null>(
    initialWrittenReviews ?? null,
  );
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[] | null>(null);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedNextCursor, setReceivedNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [writtenError, setWrittenError] = useState<string | null>(null);
  const [receivedError, setReceivedError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  useEffect(() => {
    if (initialSitterId !== undefined) return;
    const controller = new AbortController();
    fetch("/api/users/me", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setSitterId(json.data?.sitter_id ?? null))
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError") setSitterId(null);
      });
    return () => controller.abort();
  }, [initialSitterId]);

  useEffect(() => {
    if (activeTab !== "written" || writtenFetchedRef.current || writtenReviews !== null)
      return;
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
    return () => {
      controller.abort();
      writtenFetchedRef.current = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "received" || receivedFetchedRef.current || receivedReviews !== null)
      return;
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
    return () => {
      controller.abort();
      receivedFetchedRef.current = false;
    };
  }, [activeTab, sitterId]);

  const handleDeleteWritten = (id: string) => {
    setWrittenReviews((prev) => (prev ? prev.filter((r) => r.id !== id) : []));
    setShowDeleteSuccess(true);
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
      : sitterId === undefined || (sitterId !== null && receivedReviews === null);

  const writtenCount = writtenReviews?.length ?? 0;
  const receivedCount = receivedTotal;

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="뒤로 가기" className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-stone-900" />
          </button>
          <span className="flex-1 font-semibold text-stone-900">후기 관리</span>
        </div>
      </div>

      <main className="w-full max-w-200 mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">후기 관리</h2>
            <p className="text-sm text-gray-500 mt-1">
              작성한 후기와 받은 후기를 확인하세요
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-orange-100 rounded-2xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white"
                  : "text-orange-500 hover:text-orange-600"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs ${activeTab === tab.id ? "text-white/80" : "text-orange-500/70"}`}
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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "written" ? (
          writtenReviews !== null &&
          (writtenError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-semibold text-stone-900 mb-1">오류가 발생했어요</p>
              <p className="text-sm text-gray-500 mb-6">{writtenError}</p>
              <button
                onClick={() => {
                  writtenFetchedRef.current = false;
                  setWrittenError(null);
                  setWrittenReviews(null);
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : writtenReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Star size={28} className="text-orange-200" />
              </div>
              <p className="font-semibold text-stone-900 mb-1">작성한 후기가 없어요</p>
              <p className="text-sm text-gray-500 mb-6">서비스를 이용하고 후기를 남겨보세요</p>
              <Link
                href="/petsitters"
                className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
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
              <p className="font-semibold text-stone-900 mb-1">오류가 발생했어요</p>
              <p className="text-sm text-gray-500 mb-6">{receivedError}</p>
              <button
                onClick={() => {
                  receivedFetchedRef.current = false;
                  setReceivedError(null);
                  setReceivedReviews(null);
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : receivedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Star size={28} className="text-orange-200" />
              </div>
              <p className="font-semibold text-stone-900 mb-1">받은 후기가 없어요</p>
              <p className="text-sm text-gray-500">
                {sitterId === null
                  ? "펫시터로 등록하면 후기를 받을 수 있어요"
                  : "펫시터로 활동하고 첫 후기를 받아보세요"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {receivedReviews.map((review) => (
                <ReceivedReviewCard key={review.id} review={review} />
              ))}
              {loadMoreError && (
                <p className="text-center text-sm text-red-500">{loadMoreError}</p>
              )}
              {receivedNextCursor && (
                <button
                  onClick={handleLoadMoreReceived}
                  disabled={isLoadingMore}
                  className="w-full py-3 rounded-xl border border-orange-200 text-sm font-medium text-orange-500 hover:border-orange-500 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </div>
          ))
        )}
      </main>

      <CustomModal
        open={showDeleteSuccess}
        type="success"
        title="후기가 삭제되었습니다."
        confirmText="확인"
        onClose={() => setShowDeleteSuccess(false)}
        onConfirm={() => setShowDeleteSuccess(false)}
      />
    </div>
  );
}
