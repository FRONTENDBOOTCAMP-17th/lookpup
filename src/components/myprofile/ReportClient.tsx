"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  AlertTriangle,
  Check,
  ImagePlus,
  X,
  Search,
  User,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import { AvatarReport } from "@/components/ui/Avatar";
import { createReport } from "@/app/actions/reports";
import { searchUsers } from "@/app/actions/users";
import { uploadToCloudinary } from "@/utils/cloudinary";

const REPORT_REASONS = [
  "부적절한 언행",
  "허위 정보",
  "예약 불이행",
  "반려동물 학대 의심",
  "사기 의심",
  "기타",
];

interface UserResult {
  id: string;
  full_name: string | null;
  profile_image: string | null;
  role: string | null;
}

export default function ReportClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTargetId = searchParams.get("targetId") ?? "";
  const paramTargetName = searchParams.get("targetName") ?? "";
  const paramTargetRole = searchParams.get("role") ?? "";
  const paramTargetService = searchParams.get("service") ?? "";
  const paramTargetImage = searchParams.get("targetImage");

  const [targetId, setTargetId] = useState(paramTargetId);
  const [targetName, setTargetName] = useState(paramTargetName || "알 수 없음");
  const [targetRole, setTargetRole] = useState(paramTargetRole);
  const [targetService, setTargetService] = useState(paramTargetService);
  const [targetImage, setTargetImage] = useState<string | null>(paramTargetImage ?? null);

  const needsSearch = !paramTargetId;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const isValid = selectedReason !== "" && content.length >= 10;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    latestQueryRef.current = query;
    setIsSearching(true);
    try {
      const result = await searchUsers(query);
      if (latestQueryRef.current !== query) return;
      if (result.data) setSearchResults(result.data as UserResult[]);
      else setSearchResults([]);
    } catch {
      setSearchResults([]);
    } finally {
      if (latestQueryRef.current === query) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!needsSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(searchQuery), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, needsSearch, handleSearch]);

  const handleSelectUser = (u: UserResult) => {
    setTargetId(u.id);
    setTargetName(u.full_name || "알 수 없음");
    setTargetRole(u.role === "both" || u.role === "admin" ? "펫시터" : "");
    setTargetService("");
    setTargetImage(u.profile_image ?? null);
    setSearchQuery("");
    setSearchResults([]);
  };

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
        images.map((file) => uploadToCloudinary(file, "reports")),
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

  const roleLabel = (role: string | null) =>
    role === "both" || role === "admin" ? "펫시터" : "";

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-stone-900" />
          </button>
          <span className="flex-1 font-semibold text-stone-900">신고하기</span>
        </div>
      </div>

      <main className="max-w-190 mx-auto px-4 md:px-6 pt-4 md:pt-12 pb-20">
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <h1 className="text-2xl font-bold text-stone-900">신고하기</h1>
        </div>

        <div className="flex flex-col gap-4 pt-8">
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-px" />
            <p className="text-sm text-orange-900 leading-[1.6]">
              허위 신고 시 서비스 이용에 제한이 있을 수 있습니다. 신중하게 신고해 주세요.
            </p>
          </div>

          {needsSearch && (
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
              <p className="text-lg font-bold text-stone-900 mb-4">신고할 사용자 검색</p>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색"
                  className="w-full pl-10 pr-4 py-3 border border-orange-100 rounded-xl text-[15px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>

              {(searchResults.length > 0 || isSearching) && (
                <div className="mt-2 border border-orange-100 rounded-xl overflow-hidden">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">검색 중...</div>
                  ) : (
                    searchResults.map((u) => {
                      const label = roleLabel(u.role);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-orange-50 last:border-b-0"
                        >
                          {u.profile_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.profile_image}
                              alt={u.full_name ?? ""}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-orange-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-stone-900 flex-1">
                            {u.full_name || "알 수 없음"}
                          </span>
                          {label && (
                            <span className="px-2.5 py-0.5 text-xs text-orange-500 bg-orange-50 border border-orange-100 rounded-full shrink-0">
                              {label}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {searchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                <p className="mt-3 text-sm text-gray-400 text-center">검색 결과가 없습니다.</p>
              )}
            </div>
          )}

          {targetId && (
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500">신고 대상</p>
                {needsSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetId("");
                      setTargetName("알 수 없음");
                      setTargetRole("");
                      setTargetService("");
                      setTargetImage(null);
                    }}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    다시 선택
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <AvatarReport
                  initial={targetName.charAt(0)}
                  src={targetImage}
                  badge={<Check className="w-3 h-3 text-white stroke-[2.5]" />}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-stone-900">{targetName}</span>
                    {targetRole && (
                      <span className="px-2.5 py-0.5 text-xs text-orange-500 bg-orange-50 border border-orange-100 rounded-full">
                        {targetRole}
                      </span>
                    )}
                  </div>
                  {targetService && <p className="text-sm text-gray-500">{targetService}</p>}
                </div>
              </div>
            </div>
          )}

          {targetId && (
            <>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
                <p className="text-lg font-bold text-stone-900">신고 사유<span className="text-red-500 ml-0.5">*</span></p>
                <div className="flex flex-col gap-2.5 mt-4">
                  {REPORT_REASONS.map((reason) => {
                    const active = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setSelectedReason(reason)}
                        className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-left transition-colors ${
                          active ? "border-orange-500 bg-orange-50" : "border-orange-100 bg-white hover:bg-orange-50"
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

              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
                <p className="text-lg font-bold text-stone-900">상세 내용<span className="text-red-500 ml-0.5">*</span></p>
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

              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-stone-900">증거 자료 첨부</p>
                  <span className="text-xs px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-gray-500">선택</span>
                  <span className="ml-auto text-xs text-gray-500">최대 5장</span>
                </div>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {images.map((file, i) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}`} className="relative w-20 h-20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrls[i]} alt={`첨부 ${i + 1}`} className="w-20 h-20 object-cover rounded-xl" />
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

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}

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
            </>
          )}
        </div>
      </main>

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
