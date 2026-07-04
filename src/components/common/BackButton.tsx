"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 뒤로가기 버튼 유형 1
 * 회색 < 아이콘 + 텍스트, hover 시 주황색 전환.
 * 펫시터 프로필 상세 /구인 게시판 상세글
 */
interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  href,
  label = "목록으로",
  className = "",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors w-fit ${className}`}
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-base">{label}</span>
    </Link>
  );
}

/**
 * 뒤로가기 버튼 유형 2
 * 마이프로필 페이지 헤더에서 사용.
 */
interface HeaderBackButtonProps {
  onClick?: () => void;
  className?: string;
}

export function MobileBackButton({
  onClick,
  className = "",
}: HeaderBackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      aria-label="뒤로 가기"
      className={`p-1 -ml-1 ${className}`}
    >
      <ChevronLeft size={24} className="text-stone-900" />
    </button>
  );
}

export function DesktopBackButton({
  onClick,
  className = "",
}: HeaderBackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      aria-label="뒤로 가기"
      className={`w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0 ${className}`}
    >
      <ChevronLeft size={20} className="text-stone-900" />
    </button>
  );
}
