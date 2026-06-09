"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calendar, MessageSquare, CheckCircle, FileText } from "lucide-react";

//알람 임시 더미데이터
const NOTIFICATIONS = [
  {
    id: 1,
    title: "예약 지원이 도착했어요",
    body: "박지현 님이 방문돌봄에 지원했습니다.",
    time: "5분 전",
    unread: true,
    icon: <Calendar size={16} className="text-orange-500" />,
    iconBg: "bg-orange-50",
  },
  {
    id: 2,
    title: "새로운 채팅이 왔어요",
    body: "이지현: 안녕하세요! 일정 조율 가능할까요?",
    time: "23분 전",
    unread: true,
    icon: <MessageSquare size={16} className="text-sky-600" />,
    iconBg: "bg-sky-100",
  },
  {
    id: 3,
    title: "후기를 남겨주세요",
    body: "방문돌봄 서비스 후기를 작성해주세요.",
    time: "2시간 전",
    unread: false,
    icon: <FileText size={16} className="text-purple-800" />,
    iconBg: "bg-pink-100",
  },
  {
    id: 4,
    title: "예약이 승인되었어요",
    body: "6월 21일 산책 서비스가 확정되었습니다.",
    time: "1일 전",
    unread: false,
    icon: <CheckCircle size={16} className="text-green-700" />,
    iconBg: "bg-green-100",
  },
];

export default function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {[
            { href: "/petsitters", label: "펫시터 찾기" },
            { href: "/board", label: "구인게시판" },
            { href: "/about", label: "서비스 소개" },
          ].map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`text-base font-medium transition-colors pb-0.5 ${
                  isActive
                    ? "text-orange-500 border-b border-orange-500"
                    : "text-gray-500 hover:text-orange-500"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 사용자 액션 */}
        <div className="flex items-center gap-4">
          {/* 알림 버튼 + 모달 */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-orange-50 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-500">
                <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] border border-orange-100 flex flex-col overflow-hidden">
                {/* 모달 헤더 */}
                <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-900 text-base font-bold">알림</span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button className="text-gray-500 text-xs font-medium hover:text-orange-500 transition-colors">
                    모두 읽음 처리
                  </button>
                </div>

                {/* 알림 목록 */}
                <div className="max-h-96 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="relative px-5 py-4 border-b border-orange-100/50 last:border-0 flex items-start gap-3 hover:bg-orange-50/50 transition-colors cursor-pointer">
                      <div className={`w-9 h-9 ${n.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-5 ${n.unread ? "text-stone-900" : "text-gray-500"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 leading-4 mt-0.5 truncate">{n.body}</p>
                        <p className="text-xs text-gray-400 leading-4 mt-1">{n.time}</p>
                      </div>
                      {n.unread && (
                        <span className="absolute left-2 top-[43px] w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>

                {/* 전체 알림 보기 */}
                <div className="border-t border-orange-100 shrink-0">
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block w-full py-3 text-center text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors"
                  >
                    전체 알림 보기
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/myprofile"
            className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center hover:border-orange-300 transition-colors"
          >
            <span className="text-orange-500 text-base font-semibold">김</span>
          </Link>

          <Link
            href="/chat"
            className="flex items-center px-4 h-9 bg-orange-500 hover:bg-orange-600 transition-colors rounded-[10px] text-white text-xs font-semibold whitespace-nowrap"
          >
            <span className="hidden lg:inline">채팅</span>
            <span className="lg:hidden">채팅</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
