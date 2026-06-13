"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, FileText, Bell, MessageCircle, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/petsitters", label: "펫시터 찾기", Icon: Search },
  { href: "/board", label: "구인 게시판", Icon: FileText },
  { href: "/notifications", label: "알림", Icon: Bell },
  { href: "/chat", label: "채팅", Icon: MessageCircle },
  { href: "/myprofile", label: "내 프로필", Icon: User },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#FFE9D6] shadow-[0px_-2px_6px_rgba(0,0,0,0.04)] h-[72px]">
      <div className="flex h-full">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/myprofile"
              ? pathname.startsWith("/myprofile")
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1"
            >
              <Icon size={22} className={active ? "text-[#E8742A]" : "text-gray-400"} />
              <span
                className={`text-[11px] font-medium leading-[1.6] ${
                  active ? "text-[#E8742A]" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
