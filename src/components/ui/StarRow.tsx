import { Star } from "lucide-react";

interface Props {
  /** 아이콘 크기 (px) */
  size: number;
  /** 채울 별 개수. 기본값 5 (전체). 개별 리뷰 별점 표시 시 지정 */
  count?: number;
}

/**
 * 별점 아이콘 행.
 * 항상 별 5개를 랜더링함!
 * 펫시터 프로필 미리보기 / 펫시터 프로필의 별점.
 */
export default function StarRow({ size, count = 5 }: Props) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </>
  );
}
