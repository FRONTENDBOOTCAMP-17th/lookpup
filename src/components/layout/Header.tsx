import Link from "next/link";
import Image from "next/image";
import { Bell, MessageCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-orange-100 shadow-[0px_1px_8px_0px_rgba(232,116,42,0.08)] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-10 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="봐주개"
            width={120}
            height={36}
            priority
            className="object-contain h-auto"
          />
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/petsitters"
            className="text-gray-500 text-base font-medium hover:text-orange-500 transition-colors"
          >
            펫시터 찾기
          </Link>
          <Link
            href="/board"
            className="text-gray-500 text-base font-medium hover:text-orange-500 transition-colors"
          >
            구인게시판
          </Link>
          <Link
            href="/about"
            className="text-gray-500 text-base font-medium hover:text-orange-500 transition-colors"
          >
            서비스 소개
          </Link>
        </nav>

        {/* 사용자 액션 */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-orange-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium leading-none">
              3
            </span>
          </button>

          <Link
            href="/myprofile"
            className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center hover:border-orange-300 transition-colors"
          >
            <span className="text-orange-500 text-base font-semibold">김</span>
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-4 h-9 bg-orange-500 hover:bg-orange-600 transition-colors rounded-[10px] text-white text-xs font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            채팅
          </Link>
        </div>
      </div>
    </header>
  );
}
