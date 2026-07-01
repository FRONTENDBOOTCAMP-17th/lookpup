"use client";

import Link from "next/link";
import { useUserStore } from "@/store/userStore";

export default function HeroButtons() {
  const { user } = useUserStore();
  const isSitter = user?.role === "both" || user?.role === "admin";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
      <Link
        href="/petsitters"
        className="w-40 h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(232,116,42,0.15)] transition-colors"
      >
        펫시터 찾기
      </Link>
      {!isSitter && (
        <Link
          href="/sitter-register"
          className="w-40 h-12 bg-white hover:bg-orange-50 text-orange-500 text-base font-semibold rounded-[10px] border border-orange-500 flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(232,116,42,0.15)] transition-colors"
        >
          펫시터 등록하기
        </Link>
      )}
    </div>
  );
}
