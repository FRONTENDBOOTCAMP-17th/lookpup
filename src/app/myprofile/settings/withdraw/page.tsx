"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  PawPrint,
} from "lucide-react";
import Header from "@/components/layout/Header";

// 탈퇴 사유 목록
const REASONS = [
  { id: "low_usage", label: "이용 빈도가 낮아요" },
  { id: "no_service", label: "원하는 서비스를 찾지 못했어요" },
  { id: "inconvenient", label: "사용 방법이 불편했어요" },
  { id: "privacy", label: "개인정보가 걱정돼요" },
  { id: "other", label: "기타" },
];

// 확인 모달
function ConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative bg-white w-full max-w-130 rounded-[20px] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertTriangle size={28} className="text-[#EF4444]" />
          </div>
          <h3 className="text-xl font-bold text-[#281A0E] mb-2">
            정말 탈퇴하시겠습니까?
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            회원 탈퇴 후 계정 복구는 불가능합니다.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-semibold hover:bg-[#FFF8F3] transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-[#EF4444] text-white font-semibold hover:bg-red-600 transition-colors"
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}

// 탈퇴 완료 화면
function SuccessScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-6">
        <PawPrint size={40} className="text-[#E8742A]" />
      </div>
      <div className="mb-2">
        <CheckCircle2 size={28} className="text-green-500 mx-auto mb-4" />
      </div>
      <h2 className="text-xl font-bold text-[#281A0E] mb-3">
        회원 탈퇴가 완료되었습니다
      </h2>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-8">
        그동안 봐주개를 이용해주셔서 감사합니다.
      </p>
      <button
        onClick={onGoHome}
        className="h-12 px-8 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
      >
        메인으로 이동
      </button>
    </div>
  );
}

export default function WithdrawPage() {
  const router = useRouter();

  // TODO: 실제 진행 중인 예약 여부는 API에서 조회
  const hasActiveBookings = false;

  const [selectedReason, setSelectedReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = agreed && selectedReason !== "";

  const handleDelete = () => {
    setShowModal(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      <main className="max-w-190 mx-auto px-4 md:px-6 pt-12 pb-20">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center border border-[#FFE9D6] rounded-xl shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#281A0E]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#281A0E]">회원 탈퇴</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              서비스 이용을 종료하고 계정을 삭제할 수 있어요
            </p>
          </div>
        </div>

        {done ? (
          <SuccessScreen onGoHome={() => router.push("/")} />
        ) : (
          <div className="space-y-4">
            {/* 진행 중인 예약이 있으면 탈퇴 차단 */}
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
                <button
                  type="button"
                  onClick={() => router.push("/myprofile/booking-history")}
                  className="w-full h-11 rounded-xl border border-red-200 bg-white text-[#EF4444] font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  예약 내역 보기
                </button>
              </div>
            )}

            {/* 탈퇴 전 유의사항 */}
            <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E8] flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-[#E8742A]" />
                </div>
                <h3 className="font-semibold text-[#281A0E]">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8742A] shrink-0 mt-1.75" />
                    <span className="text-sm text-[#6B7280] leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 진행 중인 예약이 없을 때만 사유 선택 및 폼 표시 */}
            {!hasActiveBookings && (
              <>
                {/* 탈퇴 사유 선택 */}
                <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6">
                  <h3 className="font-semibold text-[#281A0E] mb-4">
                    탈퇴 이유를 알려주세요
                  </h3>
                  <div className="space-y-3">
                    {REASONS.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedReason === r.id
                            ? "border-[#E8742A] bg-[#FFF0E8]"
                            : "border-[#FFE9D6] hover:border-[#E8742A]/40"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selectedReason === r.id
                              ? "border-[#E8742A] bg-[#E8742A]"
                              : "border-[#D1D5DB]"
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
                          className={`text-sm font-medium ${selectedReason === r.id ? "text-[#E8742A]" : "text-[#281A0E]"}`}
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
                        className="w-full px-4 py-3 border border-[#FFE9D6] rounded-xl text-sm text-[#281A0E] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8742A] resize-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* 탈퇴 동의 체크박스 */}
                <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6">
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setAgreed((a) => !a)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        agreed
                          ? "bg-[#EF4444] border-[#EF4444]"
                          : "border-[#D1D5DB]"
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
                    <span className="text-sm text-[#281A0E] leading-relaxed">
                      위 내용을 모두 확인했으며 회원 탈퇴에 동의합니다
                    </span>
                  </label>
                </div>

                {/* 하단 버튼 */}
                <div className="flex gap-3 pb-4">
                  <button
                    type="button"
                    onClick={() => router.push("/myprofile")}
                    className="flex-1 h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-semibold hover:bg-[#FFF8F3] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit}
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

      {showModal && (
        <ConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
