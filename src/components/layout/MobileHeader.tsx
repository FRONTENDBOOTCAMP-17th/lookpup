"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  ChevronRight,
  User,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions/auth";

interface UserInfo {
  name: string;
  email: string;
  initial: string;
  isVerified: boolean;
}

export default function MobileHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "";
        setUser({
          name,
          email: user.email || "",
          initial: name.charAt(0) || "?",
          isVerified: !!user.user_metadata?.is_verified,
        });
      }
    });
  }, []);

  const mainNavItems = [
    { href: "/petsitters", label: "펫시터 찾기" },
    { href: "/board", label: "구인게시판" },
    { href: "/about", label: "서비스 소개" },
  ];

  const userNavItems = [
    {
      href: "/myprofile",
      label: "마이페이지",
      Icon: User,
      iconBg: "bg-[#fff0e8]",
      iconColor: "text-[#e8742a]",
    },
    {
      href: "/chat",
      label: "채팅",
      Icon: MessageCircle,
      iconBg: "bg-[#eff6ff]",
      iconColor: "text-blue-500",
    },
  ];

  const dropdown = sidebarOpen ? (
    <div className="fixed inset-x-0 top-18 bottom-0 z-40">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setSidebarOpen(false)}
      />
      <div className="relative bg-white border-b border-[#ffe9d6] shadow-[0px_4px_10px_rgba(40,26,14,0.1)]">
        {user && (
          <div className="flex items-center gap-3 px-5 py-4 bg-[#fff8f3] border-b border-[#ffe9d6]">
            <div className="w-11 h-11 rounded-full bg-[rgba(232,116,42,0.36)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-base leading-6">
                {user.initial}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[#281a0e] font-bold text-[15px] leading-6">
                  {user.name}
                </span>
                {user.isVerified && (
                  <span className="bg-[#e8742a] text-white text-[10px] font-semibold leading-4 px-1.5 py-0.5 rounded-sm">
                    인증
                  </span>
                )}
              </div>
              <span className="text-[#9ca3af] text-xs leading-4 truncate">
                {user.email}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col pb-1 pt-2 px-4">
          {mainNavItems.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${
                  isActive ? "bg-[#fff8f3]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#e8742a]" />
                  )}
                  <span
                    className={`text-[15px] font-medium leading-6 ${
                      isActive ? "text-[#e8742a]" : "text-[#281a0e]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <ChevronRight
                  size={15}
                  className={isActive ? "text-[#e8742a]" : "text-[#9ca3af]"}
                />
              </Link>
            );
          })}
        </div>

        <div className="mx-5 border-t border-[#ffe9d6]" />

        <div className="flex flex-col px-4 py-2">
          {userNavItems.map(({ href, label, Icon, iconBg, iconColor }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={15} className={iconColor} />
                </div>
                <span className="text-[15px] font-medium leading-6 text-[#281a0e]">
                  {label}
                </span>
              </div>
              <ChevronRight size={15} className="text-[#9ca3af]" />
            </Link>
          ))}
        </div>

        <div className="mx-5 border-t border-[#ffe9d6]" />

        <div className="px-5 py-4">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-[#ffe9d6] bg-white hover:bg-orange-50 transition-colors"
            >
              <LogOut size={16} className="text-[#6b7280]" />
              <span className="text-sm font-semibold text-[#6b7280]">
                로그아웃
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#ffe9d6] shadow-[0px_1px_4px_rgba(232,116,42,0.08)]">
        <div className="flex items-center justify-between px-5 h-18">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="봐주개"
              width={100}
              height={25}
              priority
              className="object-contain h-auto"
            />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <Bell size={20} className="text-[#281a0e]" />
            </Link>
            {user && (
              <div
                className="hidden md:flex w-8 h-8 rounded-full items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(232,116,42) 0%, rgb(245,164,104) 100%)",
                }}
              >
                <span className="text-white font-bold text-sm">
                  {user.initial}
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                sidebarOpen ? "bg-[#fff8f3]" : "hover:bg-orange-50"
              }`}
            >
              {sidebarOpen ? (
                <X size={22} className="text-[#281a0e]" />
              ) : (
                <Menu size={22} className="text-[#281a0e]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
