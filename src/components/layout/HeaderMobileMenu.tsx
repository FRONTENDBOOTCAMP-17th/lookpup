"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useUserStore } from "@/store/userStore";

type NavItem = { href: string; label: string };

export default function HeaderMobileMenu({ navItems }: { navItems: readonly NavItem[] }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn, isLoading, clearUser, unreadCount } = useUserStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="md:hidden w-full bg-white">
      {/* 모바일 헤더 바 */}
      <div className="h-16 px-5 flex items-center justify-between">
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

              <Link
                href="/myprofile"
                aria-label="마이페이지로 이동"
                className="hidden min-[480px]:flex size-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 items-center justify-center text-white text-sm font-bold leading-5"
              >
                {user?.profileImage ? (
                  <Image src={user.profileImage} alt="" width={32} height={32} className="rounded-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) ?? "?"
                )}
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
            className={`size-10 rounded-xl flex items-center justify-center transition-colors ${open ? "bg-orange-50" : "hover:bg-orange-50"}`}
          >
            {open ? (
              <X size={22} className="text-stone-900" strokeWidth={2} />
            ) : (
              <Menu size={22} className="text-stone-900" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* 드롭다운 */}
      {open && (
        <div className="w-full bg-white border-t border-orange-100 border-b shadow-[0px_4px_20px_0px_rgba(40,26,14,0.10)]">
          {!isLoading && isLoggedIn && (
            <div className="w-full px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
              <Link
                href="/myprofile"
                onClick={() => setOpen(false)}
                className="size-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-white text-base font-bold leading-6 shrink-0"
              >
                {user?.profileImage ? (
                  <Image src={user.profileImage} alt="" width={44} height={44} className="rounded-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) ?? "?"
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-stone-900 text-base font-bold leading-6">{user?.fullName || "사용자"}</p>
                  {user?.isVerified && (
                    <span className="px-1.5 h-5 rounded-sm bg-orange-500 flex items-center text-white text-[10px] font-normal leading-4">
                      인증
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-gray-400 text-xs font-normal leading-4 truncate">{user?.email || ""}</p>
              </div>
            </div>
          )}

          <nav className="w-full px-4 pt-2 pb-1 flex flex-col">
            {navItems.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3.5 rounded-xl inline-flex items-center justify-between text-base font-medium leading-6 transition-colors ${
                    active ? "bg-orange-50 text-orange-500" : "text-stone-900 hover:bg-orange-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {active && <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />}
                    {label}
                  </span>
                  {isLoggedIn && (
                    <ChevronRight size={16} className={active ? "text-orange-500" : "text-gray-300"} strokeWidth={2} />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-5"><div className="h-px w-full bg-orange-100" /></div>

          {!isLoading && (
            isLoggedIn ? (
              <>
                <div className="w-full px-4 py-2 flex flex-col">
                  <Link href="/myprofile" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors">
                    <span className="inline-flex items-center gap-3">
                      <span className="size-8 bg-orange-50 rounded-xl flex items-center justify-center">
                        <User size={16} className="text-orange-500" strokeWidth={1.8} />
                      </span>
                      <span className="text-stone-900 text-base font-medium leading-6">마이페이지</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
                  </Link>

                  <Link href="/chat" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors">
                    <span className="inline-flex items-center gap-3">
                      <span className="size-8 bg-blue-50 rounded-xl flex items-center justify-center">
                        <MessageSquare size={16} className="text-blue-500" strokeWidth={1.8} />
                      </span>
                      <span className="text-stone-900 text-base font-medium leading-6">채팅</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
                  </Link>

                  {user?.role === "admin" && (
                    <Link href="/admin/reports" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl inline-flex items-center justify-between hover:bg-orange-50 transition-colors">
                      <span className="inline-flex items-center gap-3">
                        <span className="size-8 bg-orange-50 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={16} className="text-orange-500" strokeWidth={1.8} />
                        </span>
                        <span className="text-stone-900 text-base font-medium leading-6">관리자 페이지</span>
                      </span>
                      <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
                    </Link>
                  )}
                </div>

                <div className="px-5"><div className="h-px w-full bg-orange-100" /></div>

                <div className="w-full px-5 py-4">
                  <button
                    type="button"
                    onClick={() => { clearUser(); signOut(); }}
                    className="w-full h-12 rounded-xl border border-orange-100 bg-white flex items-center justify-center gap-2 text-gray-500 text-sm font-normal leading-6 hover:bg-orange-50 transition-colors"
                  >
                    <LogOut size={16} className="text-gray-500" strokeWidth={1.8} />
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full px-5 pt-4 pb-5 flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="w-full h-12 rounded-[10px] border border-orange-500 bg-white flex items-center justify-center text-orange-500 text-base font-normal leading-6 hover:bg-orange-50 transition-colors"
                >
                  로그인
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
