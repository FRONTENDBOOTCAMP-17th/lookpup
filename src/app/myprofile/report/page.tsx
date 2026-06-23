"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, AlertTriangle, Check, ImagePlus, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import { AvatarReport } from "@/components/ui/Avatar";
import { createReport } from "@/app/actions/reports";
import { uploadToCloudinary } from "@/utils/cloudinary";

const REPORT_REASONS = [
  "부적절한 언행",
  "허위 정보",
  "예약 불이행",
  "반려동물 학대 의심",
  "사기 의심",
  "기타",
];

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId      = searchParams.get("targetId") ?? "";
  const targetName    = searchParams.get("targetName") ?? "알 수 없음";
  const targetRole    = searchParams.get("role") ?? "";
  const targetService = searchParams.get("service") ?? "";
  const targetImage   = searchParams.get("targetImage");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const isValid = selectedReason !== "" && content.length >= 10;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const image_urls = await Promise.all(
        images.map((file) => uploadToCloudinary(file, "reports"))
      );

      const target_type = targetRole === "펫시터" ? "sitter" : "user";

      const result = await createReport({
        target_type,
        target_id: targetId,
        reason: selectedReason,
        content: content || null,
        image_urls,
      });

      if (result.error) {
        setSubmitError(result.error.message);
        return;
      }

      setShowSuccessModal(true);
    } catch {
      setSubmitError("신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-stone-900" />
          </button>
          <span className="flex-1 font-semibold text-stone-900">
            신고하기
          </span>
        </div>
      </div>

      <main className="max-w-190 mx-auto px-4 md:px-6 pt-4 md:pt-12 pb-20">
        {/* 페이지 타이틀 */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <h1 className="text-2xl font-bold text-stone-900">신고하기</h1>
        </div>

        <div className="flex flex-col gap-4 pt-8">
          {/* 경고 배너 */}
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-px" />
            <p className="text-sm text-orange-900 leading-[1.6]">
              허위 신고 시 서비스 이용에 제한이 있을 수 있습니다. 신중하게 신고해 주세요.
            </p>
          </div>

          {/* 신고 대상 */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
            <p className="text-sm font-semibold text-gray-500">신고 대상</p>
            <div className="flex items-center gap-4 mt-4">
              <AvatarReport
                initial={targetName.charAt(0)}
                src={targetImage}
                badge={<Check className="w-3 h-3 text-white stroke-[2.5]" />}
              />
              {/* 이름 · 역할 · 서비스 정보 */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-stone-900">{targetName}</span>
                  {targetRole && (
                    <span className="px-2.5 py-0.5 text-xs text-orange-500 bg-orange-50 border border-orange-100 rounded-full">
                      {targetRole}
                    </span>
                  )}
                </div>
                {targetService && (
                  <p className="text-sm text-gray-500">{targetService}</p>
                )}
              </div>
            </div>
          </div>

          {/* 신고 사유 */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
            <p className="text-lg font-bold text-stone-900">신고 사유</p>
            <div className="flex flex-col gap-2.5 mt-4">
              {REPORT_REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-left transition-colors ${
                      active
                        ? "border-orange-500 bg-orange-50"
                        : "border-orange-100 bg-white hover:bg-orange-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        active ? "border-orange-500" : "border-orange-100"
                      }`}
                    >
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                    <span className="text-sm font-medium text-stone-900">{reason}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상세 내용 */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
            <p className="text-lg font-bold text-stone-900">상세 내용</p>
            <p className="text-sm text-gray-500 mt-1">최소 10자 이상 작성해주세요</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="상황을 구체적으로 작성해주세요. 발생한 날짜, 시간, 상황 등을 포함하면 빠른 처리에 도움이 됩니다."
              className="mt-4 w-full h-45 border border-orange-100 rounded-xl px-4 py-3 text-[15px] text-stone-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-orange-500 bg-white leading-6"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">{content.length} / 1000</span>
            </div>
          </div>

          {/* 증거 자료 첨부 */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-stone-900">증거 자료 첨부</p>
              <span className="text-xs text-gray-500">최대 5장</span>
            </div>

            {/* 미리보기 */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {images.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`첨부 ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full border-2 border-dashed border-orange-100 rounded-xl py-10 flex flex-col items-center gap-3 hover:bg-orange-50 transition-colors"
              >
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-orange-500" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-medium text-stone-900">사진을 업로드하세요</span>
                  <span className="text-xs text-gray-500">최대 5장 업로드 가능</span>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* 오류 메시지 */}
          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          {/* 하단 버튼 */}
          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 h-12 border border-orange-100 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`flex-1 h-12 rounded-xl text-[15px] font-semibold transition-colors ${
                isValid && !isSubmitting
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-orange-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "접수 중..." : "신고 접수"}
            </button>
          </div>
        </div>
      </main>
      {/* 신고 접수 완료 기능 모달 */}
      <CustomModal
        open={showSuccessModal}
        preset="success"
        title="신고가 접수되었습니다."
        description="신고 내용을 검토 후 처리하겠습니다."
        onConfirm={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        showCloseButton={false}
      />
    </div>
  );
}
