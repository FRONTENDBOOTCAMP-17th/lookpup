import type { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * 공통 섹션 래퍼 카드.
 * 흰 배경 + 주황 계열 그림자·테두리 모양 컨테이너.
 * 구인 게시글 상세 보기 // 게시글 관리 + 내 프로필 설정 + 펫시터 프로필 수정에서도 사용 가능
 */
export default function SectionCard({
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4 ${className}`}
    >
      {children}
    </div>
  );
}
