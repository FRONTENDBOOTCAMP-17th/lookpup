"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useUserStore } from "@/store/userStore";

const NAV_ITEMS = [
  { href: "/petsitters", label: "펫시터 찾기" },
  { href: "/board", label: "구인게시판" },
  { href: "/about", label: "서비스 소개" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, isLoading, clearUser } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;

  const fetchUnreadCount = () => {
    fetch("/api/notifications?limit=1")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setUnreadCount(json.data.unread_total ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        fetchUnreadCount,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, userId]);

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-orange-100 shadow-[0px_1px_8px_0px_rgba(232,116,42,0.08)]">
      <div ref={mobileMenuRef} className="w-full">
        {/* Desktop / Tablet Header */}
        <div className="hidden md:flex h-16 w-full justify-center">
          <div className="relative w-full max-w-[1280px] px-10 flex items-center justify-between gap-6">
            {/* 로고 */}
            <Link href="/" className="shrink-0" aria-label="봐주개 홈으로 이동">
              <Image
                src="/logo.png"
                alt="봐주개"
                width={120}
                height={36}
                priority
                className="w-24 h-auto object-contain"
              />
            </Link>

            {/* 네비게이션 — 좌/우 영역 너비가 바뀌어도(로그인 상태 로딩 등) 흔들리지 않도록 화면 중앙에 절대 위치 고정 */}
            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = isActivePath(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`h-7 flex items-start text-base font-medium leading-6 transition-colors border-b-2 ${
                      isActive
                        ? "text-orange-500 border-orange-500"
                        : "text-gray-500 border-transparent hover:text-orange-500"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* 우측 액션 */}
            {isLoading ? null : isLoggedIn ? (
              <div className="flex items-center gap-2 shrink-0">
                {/* 알림 */}
                <Link
                  href="/notifications"
                  aria-label="알림 보기"
                  className="relative p-2 rounded-full hover:bg-orange-50 transition-colors"
                >
                  <Bell size={20} className="text-gray-500" strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-4">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* 아바타 + HoverCard 드롭다운 */}
                <HoverCard openDelay={80} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      aria-label="계정 메뉴 열기"
                      className="ml-1 size-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-white text-sm font-bold leading-5 hover:ring-2 hover:ring-orange-200 transition cursor-pointer"
                    >
                      {user?.fullName?.charAt(0) ?? "?"}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="end"
                    sideOffset={8}
                    className="w-44 p-1 bg-white border border-[#ffe9d6] rounded-xl ring-0 shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)]"
                  >
                    <button
                      type="button"
                      onClick={() => router.push("/myprofile")}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <User
                        size={16}
                        className="text-orange-500 shrink-0"
                        strokeWidth={1.8}
                      />
                      마이페이지
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/chat")}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <MessageSquare
                        size={16}
                        className="text-orange-500 shrink-0"
                        strokeWidth={1.8}
                      />
                      채팅
                    </button>

                    {user?.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => router.push("/admin")}
                        className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <ShieldCheck
                          size={16}
                          className="text-orange-500 shrink-0"
                          strokeWidth={1.8}
                        />
                        관리자 페이지
                      </button>
                    )}

                    <div className="mx-2 my-1 h-px bg-[#ffe9d6]" />
                    <button
                      type="button"
                      onClick={() => {
                        clearUser();
                        signOut();
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-gray-500 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <LogOut
                        size={16}
                        className="text-gray-400 shrink-0"
                        strokeWidth={1.8}
                      />
                      로그아웃
                    </button>
                  </HoverCardContent>
                </HoverCard>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/auth/login"
                  className="h-9 px-4 inline-flex items-center justify-center rounded-[10px] border border-orange-500 bg-white text-orange-500 text-xs font-normal leading-5 hover:bg-orange-50 transition-colors"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden h-16 w-full bg-white">
          <div className="h-16 px-5 flex items-center justify-between">
            {/* 로고 */}
            <Link href="/" className="shrink-0" aria-label="봐주개 홈으로 이동">
              <Image
                src="/logo.png"
                alt="봐주개"
                width={120}
                height={36}
                priority
                className="w-24 h-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-1.5">
              {!isLoading && isLoggedIn && (
                <>
                  {/* 모바일 알림 */}
                  <Link
                    href="/notifications"
                    aria-label="알림 보기"
                    className="relative p-2 rounded-full hover:bg-orange-50 transition-colors"
                  >
                    <Bell
                      size={20}
                      className="text-gray-500"
                      strokeWidth={1.8}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-4">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* 480px 이상에서만 상단 프로필 표시하기.... */}
                  <Link
                    href="/myprofile"
                    aria-label="마이페이지로 이동"
                    className="hidden min-[480px]:flex size-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 items-center justify-center text-white text-sm font-bold leading-5"
                  >
                    {user?.fullName?.charAt(0) ?? "?"}
                  </Link>
                </>
              )}

              {/* 햄버거 버튼 */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={mobileMenuOpen}
                className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                  mobileMenuOpen ? "bg-orange-50" : "hover:bg-orange-50"
                }`}
              >
                {mobileMenuOpen ? (
                  <X size={22} className="text-stone-900" strokeWidth={2} />
                ) : (
                  <Menu size={22} className="text-stone-900" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-white border-t border-orange-100 border-b shadow-[0px_4px_20px_0px_rgba(40,26,14,0.10)]">
            {!isLoading && isLoggedIn && (
              <div className="w-full px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
                <Link
                  href="/myprofile"
                  onClick={closeMobileMenu}
                  className="size-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-white text-base font-bold leading-6 shrink-0"
                >
                  {user?.fullName?.charAt(0) ?? "?"}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-stone-900 text-base font-bold leading-6">
                      {user?.fullName || "사용자"}
                    </p>

                    {user?.isVerified && (
                      <span className="px-1.5 h-5 rounded-sm bg-orange-500 flex items-center text-white text-[10px] font-normal leading-4">
                        인증
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-gray-400 text-xs font-normal leading-4 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
            )}

            {/* 메뉴 목록 */}
            <nav className="w-full px-4 pt-2 pb-1 flex flex-col">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = isActivePath(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={`px-4 py-3.5 rounded-xl inline-flex items-center justify-between text-base font-medium leading-6 transition-colors ${
                      isActive
                        ? "bg-orange-50 text-orange-500"
                        : "text-stone-900 hover:bg-orange-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isActive && (
                        <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                      {label}
                    </span>

                    {isLoggedIn && (
                      <ChevronRight
                        size={16}
                        className={
                          isActive ? "text-orange-500" : "text-gray-300"
                        }
                        strokeWidth={2}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="px-5">
              <div className="h-px w-full bg-orange-100" />
            </div>

            {!isLoading &&
              (isLoggedIn ? (
                <>
                  {/* 로그인 상태 추가 메뉴 */}
                  <div className="w-full px-4 py-2 flex flex-col">
                    <Link
                      href="/myprofile"
                      onClick={closeMobileMenu}
                      className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="size-8 bg-orange-50 rounded-xl flex items-center justify-center">
                          <User
                            size={16}
                            className="text-orange-500"
                            strokeWidth={1.8}
                          />
                        </span>
                        <span className="text-stone-900 text-base font-medium leading-6">
                          마이페이지
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                        className="text-gray-300"
                        strokeWidth={2}
                      />
                    </Link>

                    <Link
                      href="/chat"
                      onClick={closeMobileMenu}
                      className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="size-8 bg-blue-50 rounded-xl flex items-center justify-center">
                          <MessageSquare
                            size={16}
                            className="text-blue-500"
                            strokeWidth={1.8}
                          />
                        </span>
                        <span className="text-stone-900 text-base font-medium leading-6">
                          채팅
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                        className="text-gray-300"
                        strokeWidth={2}
                      />
                    </Link>

                    {user?.role === "admin" && (
                      <Link
                        href="/admin/reports"
                        onClick={closeMobileMenu}
                        className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors"
                      >
                        <span className="inline-flex items-center gap-3">
                          <span className="size-8 bg-orange-50 rounded-xl flex items-center justify-center">
                            <ShieldCheck
                              size={16}
                              className="text-orange-500"
                              strokeWidth={1.8}
                            />
                          </span>
                          <span className="text-stone-900 text-base font-medium leading-6">
                            관리자 페이지
                          </span>
                        </span>

                        <ChevronRight
                          size={16}
                          className="text-gray-300"
                          strokeWidth={2}
                        />
                      </Link>
                    )}
                  </div>

                  <div className="px-5">
                    <div className="h-px w-full bg-orange-100" />
                  </div>

                  {/* 로그아웃 */}
                  <div className="w-full px-5 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        clearUser();
                        signOut();
                      }}
                      className="w-full h-12 rounded-xl border border-orange-100 bg-white flex items-center justify-center gap-2 text-gray-500 text-sm font-normal leading-6 hover:bg-orange-50 transition-colors"
                    >
                      <LogOut
                        size={16}
                        className="text-gray-500"
                        strokeWidth={1.8}
                      />
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                /* 비로그인 상태 로그인 */
                <div className="w-full px-5 pt-4 pb-5 flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="w-full h-12 rounded-[10px] border border-orange-500 bg-white flex items-center justify-center text-orange-500 text-base font-normal leading-6 hover:bg-orange-50 transition-colors"
                  >
                    로그인
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </header>
  );
}
