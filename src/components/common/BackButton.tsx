import Link from "next/link";
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
