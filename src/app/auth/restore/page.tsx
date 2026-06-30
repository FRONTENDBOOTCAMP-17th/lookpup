"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, AlertTriangle, RotateCcw, LogOut } from "lucide-react";
import { restoreUser } from "@/app/actions/users";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";

export default function RestorePage() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    const result = await restoreUser();

    if ("error" in result) {
      setError(result.error?.message ?? "복구 중 오류가 발생했습니다.");
      setIsRestoring(false);
      return;
    }

    // 복구 성공 → onAuthStateChange 재트리거로 UserProvider가 setUser 호출
    const supabase = createClient();
    await supabase.auth.refreshSession();

    // 본인인증 재요구 (is_verified = false로 초기화됨)
    router.replace("/auth/verification");
  };

  const handleSignOut = async () => {
    clearUser();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* 아이콘 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-4">
            <PawPrint size={36} className="text-[var(--color-orange-500)]" />
          </div>
          <h1 className="text-2xl font-bold text-[#281A0E]">봐주개</h1>
        </div>

        {/* 안내 카드 */}
        <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-[var(--color-orange-500)]" />
            </div>
            <div>
              <p className="font-semibold text-[#281A0E] mb-1">탈퇴된 계정입니다</p>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                이전에 탈퇴하신 계정으로 로그인하셨습니다.
                계정을 복구하면 기존 데이터를 유지한 채로 계속 이용하실 수 있습니다.
              </p>
            </div>
          </div>

          <ul className="space-y-2 pl-1">
            {[
              "기존 반려동물 정보가 복구됩니다",
              "이전 예약 및 후기 기록이 유지됩니다",
              "보안을 위해 본인인증을 다시 진행해야 합니다",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-orange-500)] shrink-0 mt-1.5" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full h-12 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={18} />
            {isRestoring ? "복구 중..." : "계정 복구하기"}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-semibold flex items-center justify-center gap-2 hover:bg-[#FFF0E8] transition-colors"
          >
            <LogOut size={18} />
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
