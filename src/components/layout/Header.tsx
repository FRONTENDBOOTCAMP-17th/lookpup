"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/petsitters", label: "펫시터 찾기" },
  { href: "/board", label: "구인게시판" },
  { href: "/about", label: "서비스 소개" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
          <div className="w-full max-w-[1280px] px-10 flex items-center justify-between gap-6">
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

            {/* 네비게이션 */}
            <nav className="flex flex-1 items-center justify-center gap-8">
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

            {/* 비로그인 액션 */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/login"
                className="h-9 px-4 inline-flex items-center justify-center rounded-[10px] border border-orange-500 bg-white text-orange-500 text-xs font-normal leading-5 hover:bg-orange-50 transition-colors"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="h-9 px-5 inline-flex items-center justify-center rounded-[10px] bg-orange-500 text-white text-xs font-normal leading-5 hover:bg-orange-600 transition-colors"
              >
                회원가입
              </Link>
            </div>
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-white border-t border-orange-100 border-b shadow-[0px_4px_16px_0px_rgba(40,26,14,0.08)]">
            {/* 메뉴 목록 */}
            <nav className="w-full px-4 pt-2 pb-1 flex flex-col">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = isActivePath(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={`h-12 px-4 py-3.5 rounded-xl inline-flex items-center gap-3 text-base font-medium leading-6 transition-colors ${
                      isActive
                        ? "bg-orange-50 text-orange-500"
                        : "text-stone-900 hover:bg-orange-50"
                    }`}
                  >
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                    )}
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 구분선 */}
            <div className="px-5">
              <div className="h-px w-full bg-orange-100" />
            </div>

            {/* 로그인 / 회원가입 */}
            <div className="w-full px-5 pt-4 pb-5 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="w-full h-12 rounded-[10px] border border-orange-500 bg-white flex items-center justify-center text-orange-500 text-base font-normal leading-6 hover:bg-orange-50 transition-colors"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                onClick={closeMobileMenu}
                className="w-full h-12 rounded-[10px] bg-orange-500 flex items-center justify-center text-white text-base font-normal leading-6 hover:bg-orange-600 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}