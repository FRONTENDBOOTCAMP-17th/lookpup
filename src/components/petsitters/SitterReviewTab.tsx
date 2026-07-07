"use client";

import StarRow from "@/components/ui/StarRow";
import { ImageGallery } from "@/components/common/ImageGallery";
import type { ReviewRow } from "@/hooks/queries/useSitterReviews";

export default function SitterReviewTab({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ReviewRow[];
  rating: number;
  reviewCount: number;
}) {
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-orange-500 mb-1">
              {rating.toFixed(1)}
            </p>
            <div className="flex items-center gap-0.5 justify-center mb-1">
              <StarRow size={14} count={Math.round(rating)} />
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
                <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          아직 후기가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((rv) => (
            <div
              key={rv.id}
              className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                {rv.owner?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
