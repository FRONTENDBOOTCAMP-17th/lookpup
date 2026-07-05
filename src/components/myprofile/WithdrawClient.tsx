"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  PawPrint,
} from "lucide-react";
import Header from "@/components/layout/Header";
import {
  MobileBackButton,
  DesktopBackButton,
} from "@/components/common/BackButton";
import { CustomModal } from "@/components/common/CustomModal";
import { deleteUser } from "@/app/actions/users";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";

const REASONS = [
  { id: "low_usage", label: "이용 빈도가 낮아요" },
  { id: "no_service", label: "원하는 서비스를 찾지 못했어요" },
  { id: "inconvenient", label: "사용 방법이 불편했어요" },
  { id: "privacy", label: "개인정보가 걱정돼요" },
  { id: "other", label: "기타" },
];

function SuccessScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
        <PawPrint size={40} className="text-[var(--color-orange-500)]" />
      </div>
      <div className="mb-2">
        <CheckCircle2 size={28} className="text-green-500 mx-auto mb-4" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-3">
        회원 탈퇴가 완료되었습니다
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        그동안 봐주개를 이용해주셔서 감사합니다.
      </p>
      <button
        onClick={onGoHome}
        className="h-12 px-8 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        메인으로 이동
      </button>
    </div>
  );
}

export default function WithdrawClient() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);

  const hasActiveBookings = false;

  const [selectedReason, setSelectedReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [done, setDone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canSubmit = agreed && selectedReason !== "";

  const reasonText =
    selectedReason === "other"
      ? otherText || "기타"
      : (REASONS.find((r) => r.id === selectedReason)?.label ?? "");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteUser(reasonText);

    if ("error" in result) {
      setIsDeleting(false);
      setShowModal(false);
      setDeleteError(
        result.error?.message ?? "탈퇴 처리 중 오류가 발생했습니다.",
      );
      return;
    }

    clearUser();
    const supabase = createClient();
    await supabase.auth.signOut();

    setIsDeleting(false);
    setShowModal(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <Header />

      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <MobileBackButton />
          <span className="flex-1 font-semibold text-stone-900">회원 탈퇴</span>
        </div>
      </div>

      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 pt-4 md:pt-12 pb-20">
        <div className="hidden md:flex items-center gap-3 mb-8">
          <DesktopBackButton />
          <div>
            <h1 className="text-2xl font-bold text-stone-900">회원 탈퇴</h1>
            <p className="text-sm text-gray-500 mt-1">
              서비스 이용을 종료하고 계정을 삭제할 수 있어요
            </p>
          </div>
        </div>

        {done ? (
          <SuccessScreen onGoHome={() => router.push("/")} />
        ) : (
          <div className="space-y-4">
            {hasActiveBookings && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} className="text-[#EF4444]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#EF4444] mb-1">
                      탈퇴가 제한됩니다
                    </p>
                    <p className="text-sm text-red-600 leading-relaxed">
                      진행 중인 예약이 있어 현재 회원 탈퇴가 불가능합니다.
                    </p>
                  </div>
                </div>
                <Link
                  href="/myprofile/booking-history"
                  className="w-full h-11 rounded-xl border border-red-200 bg-white text-[#EF4444] font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center"
                >
                  예약 내역 보기
                </Link>
              </div>
            )}

            <div className="bg-white border border-orange-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <AlertTriangle
                    size={20}
                    className="text-[var(--color-orange-500)]"
                  />
                </div>
                <h3 className="font-semibold text-stone-900">
                  탈퇴 전 확인해주세요
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  "회원 탈퇴 후 계정 복구는 불가능합니다.",
                  "예약 및 결제 이력은 관련 법령에 따라 일정 기간 보관될 수 있습니다.",
                  "진행 중인 예약이 있는 경우 탈퇴가 제한될 수 있습니다.",
                  "작성한 후기 및 신고 내역은 일부 보관될 수 있습니다.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-orange-500)] shrink-0 mt-1.75" />
                    <span className="text-sm text-gray-500 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {!hasActiveBookings && (
              <>
                <div className="bg-white border border-orange-100 rounded-2xl p-6">
                  <h3 className="font-semibold text-stone-900 mb-4">
                    탈퇴 이유를 알려주세요
                  </h3>
                  <div className="space-y-3">
                    {REASONS.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedReason === r.id
                            ? "border-[var(--color-orange-500)] bg-orange-50"
                            : "border-orange-100 hover:border-[var(--color-orange-500)]/40"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selectedReason === r.id
                              ? "border-[var(--color-orange-500)] bg-[var(--color-orange-500)]"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedReason === r.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <input
                          type="radio"
                          className="sr-only"
                          name="reason"
                          value={r.id}
                          checked={selectedReason === r.id}
                          onChange={() => setSelectedReason(r.id)}
                        />
                        <span
                          className={`text-sm font-medium ${selectedReason === r.id ? "text-[var(--color-orange-500)]" : "text-stone-900"}`}
                        >
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === "other" && (
                    <div className="mt-4">
                      <textarea
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        placeholder="의견을 자유롭게 입력해주세요"
                        rows={3}
                        className="w-full px-4 py-3 border border-orange-100 rounded-xl text-sm text-stone-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-orange-500)] resize-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white border border-orange-100 rounded-2xl p-6">
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setAgreed((a) => !a)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        agreed
                          ? "bg-[#EF4444] border-[#EF4444]"
                          : "border-gray-300"
                      }`}
                    >
                      {agreed && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-stone-900 leading-relaxed">
                      위 내용을 모두 확인했으며 회원 탈퇴에 동의합니다
                    </span>
                  </label>
                </div>

                {deleteError && (
                  <p className="text-sm text-red-500 text-center">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-3 pb-4">
                  <Link
                    href="/myprofile"
                    className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center"
                  >
                    취소
                  </Link>
                  <button
                    type="button"
                    disabled={!canSubmit || isDeleting}
                    onClick={() => setShowModal(true)}
                    className="flex-1 h-12 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#EF4444] text-white hover:bg-red-600"
                  >
                    회원 탈퇴
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <CustomModal
        open={showModal && !hasActiveBookings}
        preset="deleteAccount"
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
      />

      <CustomModal
        open={showModal && hasActiveBookings}
        preset="deleteAccountDisabled"
        onConfirm={() => setShowModal(false)}
        showCloseButton={false}
      />
    </div>
  );
}
