"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import { usePetRegisterForm } from "@/hooks/pet-register/usePetRegisterForm";
import { usePetRegisterMutation } from "@/hooks/pet-register/usePetRegisterMutation";
import { COMMON_NOTES } from "@/schemas/petRegister";

const inputCls =
  "w-full h-12 px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-[#281a0e] placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-orange-500)] transition-all";
const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

export default function PetRegisterClient() {
  const router = useRouter();
  const { register, watch, setValue, handleSubmit } = usePetRegisterForm();
  const mutation = usePetRegisterMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const petType = watch("petType");
  const gender = watch("gender");
  const neutered = watch("neutered");
  const notes = watch("notes");

  const selectedNotes = COMMON_NOTES.filter((note) => notes.includes(note));

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const file = files[0];
    setPhotoUrl(URL.createObjectURL(file));
    setValue("photoFile", file);
    e.target.value = "";
  };

  const handlePhotoRemove = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setValue("photoFile", null);
  };

  const toggleNote = (note: string) => {
    const isSelected = selectedNotes.includes(note);
    const next = isSelected
      ? notes.replace(note, "").replace(/\n{2,}/g, "\n").trim()
      : notes
        ? `${notes}\n${note}`
        : note;
    setValue("notes", next);
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, { onSuccess: () => setShowSuccessModal(true) });
  });

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <Header />

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-[800px]">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl border border-[#ffe9d6] flex items-center justify-center text-[#281a0e] hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-[#281a0e]">반려동물 등록</h1>
          </div>

          <form
            onSubmit={onSubmit}
            className="w-full p-7 bg-white rounded-2xl border border-[#ffe9d6] flex flex-col"
          >
            {/* Photos */}
            <section className="flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">사진</label>
              <div className="pt-3 flex items-start gap-3 overflow-x-auto">
                {photoUrl && (
                  <div className="relative shrink-0 w-32 h-32 rounded-2xl overflow-hidden border border-[#ffe9d6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="반려동물 사진" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!photoUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: "128px", height: "128px", minWidth: "128px" }}
                    className="shrink-0 bg-[#fff8f3] rounded-2xl border border-[#ffe9d6] flex flex-col justify-center items-center gap-2 hover:bg-orange-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-500" strokeWidth={2} />
                    <span className="text-gray-500 text-xs font-normal leading-4">사진 추가</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoAdd}
                />
              </div>
            </section>

            {/* Pet Type */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">동물 종류</label>
              <div className="pt-3 flex gap-3">
                {([["dog", "🐕", "강아지"], ["cat", "🐈", "고양이"]] as const).map(([type, emoji, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("petType", type)}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      petType === type
                        ? "bg-[#fff8f3] border-[var(--color-orange-500)]"
                        : "bg-white border-[#ffe9d6] hover:border-[var(--color-orange-500)]/50"
                    }`}
                  >
                    <span className="text-3xl leading-9">{emoji}</span>
                    <span className={`text-base font-medium leading-6 ${petType === type ? "text-[var(--color-orange-500)]" : "text-[#281a0e]"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Name */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">이름</label>
              <input
                type="text"
                placeholder="반려동물 이름을 입력하세요"
                className={inputCls}
                {...register("name")}
              />
            </section>

            {/* Breed */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">품종</label>
              <input
                type="text"
                placeholder="품종을 입력하세요"
                className={inputCls}
                {...register("breed")}
              />
            </section>

            {/* Age & Weight */}
            <section className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">나이</label>
                  <input
                    type="number"
                    placeholder="3"
                    min={0}
                    step={1}
                    className={numberInputCls}
                    {...register("age")}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">체중 (kg)</label>
                  <input
                    type="number"
                    placeholder="4.5"
                    min={0}
                    step={0.1}
                    className={numberInputCls}
                    {...register("weight")}
                  />
                </div>
              </div>
            </section>

            {/* Gender */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">성별</label>
              <div className="pt-3 flex gap-3">
                {([["male", "남아"], ["female", "여아"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("gender", value)}
                    className={`flex-1 h-12 rounded-xl border-2 flex justify-center items-center transition-all ${
                      gender === value
                        ? "bg-[#fff8f3] border-[var(--color-orange-500)]"
                        : "bg-white border-[#ffe9d6] hover:border-[var(--color-orange-500)]/50"
                    }`}
                  >
                    <span className={`text-sm font-medium leading-5 ${gender === value ? "text-[var(--color-orange-500)]" : "text-[#281a0e]"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Neutered */}
            <section className="pt-6">
              <button
                type="button"
                onClick={() => setValue("neutered", !neutered)}
                className={`w-full h-14 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  neutered ? "bg-[#fff8f3] border-[var(--color-orange-500)]" : "bg-white border-[#ffe9d6] hover:border-[var(--color-orange-500)]/50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    neutered ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)]" : "bg-white border-gray-300"
                  }`}
                >
                  {neutered && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[#281a0e] text-sm font-medium leading-5">중성화 수술 완료</span>
              </button>
            </section>

            {/* Notes */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">특이사항</label>
              <textarea
                placeholder="알러지, 질병, 주의사항 등을 입력해주세요"
                style={{ height: "120px" }}
                maxLength={500}
                className="w-full px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal leading-6 text-[#281a0e] placeholder:text-[#281a0e]/50 resize-none focus:outline-none focus:border-[var(--color-orange-500)] transition-all"
                {...register("notes")}
              />
              <div className="pt-1 flex justify-end">
                <span className="text-gray-500 text-xs font-normal leading-4">{notes.length}/500</span>
              </div>
            </section>

            {/* Common Notes Tags */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">자주 선택되는 특이사항</label>
              <div className="pt-3 flex flex-wrap gap-2">
                {COMMON_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => toggleNote(note)}
                    className={`h-9 px-4 rounded-full border text-xs font-medium leading-4 transition-all ${
                      selectedNotes.includes(note)
                        ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)] text-white"
                        : "bg-white border-[#ffe9d6] text-[#281a0e] hover:border-[var(--color-orange-500)]/50"
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </section>

            {/* Buttons */}
            <div className="pt-8 flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 h-12 px-6 bg-white rounded-xl border border-[#ffe9d6] flex justify-center items-center hover:bg-[#fff8f3] hover:border-[var(--color-orange-500)]/50 transition-colors"
              >
                <span className="text-[#6b7280] text-base font-semibold leading-6">취소</span>
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 h-12 px-6 bg-[var(--color-orange-500)] rounded-xl flex justify-center items-center hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                <span className="text-white text-base font-semibold leading-6">
                  {mutation.isPending ? "등록 중..." : "등록하기"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <CustomModal
        open={showSuccessModal}
        preset="success"
        title="등록이 완료되었어요"
        description="이제 돌봄 요청 시 선택할 수 있습니다."
        onClose={() => router.back()}
        onConfirm={() => router.back()}
      />

      <CustomModal
        open={mutation.isError}
        preset="error"
        description={mutation.error?.message}
        onClose={() => mutation.reset()}
        onConfirm={() => mutation.reset()}
      />
    </div>
  );
}
