"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
import Header from "@/components/layout/Header";
import { createPet } from "@/app/actions/pets";

const COMMON_NOTES = ["알러지 있음", "약 복용 중", "사람 경계", "다른 동물 경계", "분리불안"];

export default function PetRegisterPage() {
  const router = useRouter();
  const [petType, setPetType] = useState<"dog" | "cat" | null>(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [neutered, setNeutered] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ url: string; blob: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - photos.length;
    const newEntries = Array.from(files).slice(0, remaining).map((file) => {
      const url = URL.createObjectURL(file);
      return { url, blob: url };
    });
    setPhotos((prev) => [...prev, ...newEntries]);
    e.target.value = "";
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].blob);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleNote = (note: string) => {
    const isSelected = selectedNotes.includes(note);
    setSelectedNotes((prev) =>
      isSelected ? prev.filter((n) => n !== note) : [...prev, note]
    );
    setNotes((prev) => {
      if (isSelected) {
        return prev.replace(note, "").replace(/\n{2,}/g, "\n").trim();
      }
      return prev ? `${prev}\n${note}` : note;
    });
  };

  const handleSubmit = async () => {
    if (!petType) { alert("동물 종류를 선택해주세요."); return; }
    if (!name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!gender) { alert("성별을 선택해주세요."); return; }

    // 화면은 성별(male/female) + 중성화(boolean)로 따로 받지만,
    // DB는 MALE / FEMALE / MALE_NEUTERED / FEMALE_NEUTERED 한 값으로 받음 → 조합
    const genderValue =
      gender === "male"
        ? neutered ? "MALE_NEUTERED" : "MALE"
        : neutered ? "FEMALE_NEUTERED" : "FEMALE";

    const result = await createPet({
      name: name.trim(),
      animal_type: petType,
      breed: breed.trim() || null,
      age: age ? parseInt(age) : 0,
      gender: genderValue,
      weight: weight ? parseFloat(weight) : 0,
      image_url: null, // 사진은 blob URL이라 미저장 — Supabase Storage 업로드는 별도 작업
      caution: notes.trim() || null,
    });

    if (result.error) {
      alert(result.error.message);
      return;
    }

    alert("반려동물이 등록되었습니다!");
    router.back();
  };

  const inputCls = "w-full h-12 px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-[#281a0e] placeholder:text-gray-400 focus:outline-none focus:border-[#e8742a] transition-all";
  const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <Header />

      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-[800px]">
          {/* 페이지 헤더 */}
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

          <div className="w-full p-7 bg-white rounded-2xl border border-[#ffe9d6] flex flex-col">
            {/* Photos */}
            <section className="flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">사진</label>
              <div className="pt-3 flex items-start gap-3 overflow-x-auto">
                {photos.map(({ url }, i) => (
                  <div key={url} className="relative shrink-0 w-32 h-32 rounded-2xl overflow-hidden border border-[#ffe9d6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`반려동물 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handlePhotoRemove(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
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
                  multiple
                  className="hidden"
                  onChange={handlePhotoAdd}
                />
              </div>
              <p className="pt-2 text-gray-500 text-xs font-normal leading-4">최대 5장까지 업로드 가능</p>
            </section>

            {/* Pet Type */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5">동물 종류</label>
              <div className="pt-3 flex gap-3">
                {([["dog", "🐕", "강아지"], ["cat", "🐈", "고양이"]] as const).map(([type, emoji, label]) => (
                  <button
                    key={type}
                    onClick={() => setPetType(type)}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      petType === type
                        ? "bg-[#fff8f3] border-[#e8742a]"
                        : "bg-white border-[#ffe9d6] hover:border-[#e8742a]/50"
                    }`}
                  >
                    <span className="text-3xl leading-9">{emoji}</span>
                    <span className={`text-base font-medium leading-6 ${petType === type ? "text-[#e8742a]" : "text-[#281a0e]"}`}>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="반려동물 이름을 입력하세요"
                className={inputCls}
              />
            </section>

            {/* Breed */}
            <section className="pt-6 flex flex-col">
              <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">품종</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="품종을 입력하세요"
                className={inputCls}
              />
            </section>

            {/* Age & Weight */}
            <section className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">나이</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="3"
                    min={0}
                    step={1}
                    className={numberInputCls}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[#281a0e] text-sm font-medium leading-5 mb-2">체중 (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="4.5"
                    min={0}
                    step={0.1}
                    className={numberInputCls}
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
                    onClick={() => setGender(value)}
                    className={`flex-1 h-12 rounded-xl border-2 flex justify-center items-center transition-all ${
                      gender === value
                        ? "bg-[#fff8f3] border-[#e8742a]"
                        : "bg-white border-[#ffe9d6] hover:border-[#e8742a]/50"
                    }`}
                  >
                    <span className={`text-sm font-medium leading-5 ${gender === value ? "text-[#e8742a]" : "text-[#281a0e]"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Neutered */}
            <section className="pt-6">
              <button
                onClick={() => setNeutered((v) => !v)}
                className={`w-full h-14 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  neutered ? "bg-[#fff8f3] border-[#e8742a]" : "bg-white border-[#ffe9d6] hover:border-[#e8742a]/50"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  neutered ? "bg-[#e8742a] border-[#e8742a]" : "bg-white border-gray-300"
                }`}>
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
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setNotes(e.target.value);
                }}
                placeholder="알러지, 질병, 주의사항 등을 입력해주세요"
                style={{ height: "120px" }}
                className="w-full px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal leading-6 text-[#281a0e] placeholder:text-[#281a0e]/50 resize-none focus:outline-none focus:border-[#e8742a] transition-all"
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
                    onClick={() => toggleNote(note)}
                    className={`h-9 px-4 rounded-full border text-xs font-medium leading-4 transition-all ${
                      selectedNotes.includes(note)
                        ? "bg-[#e8742a] border-[#e8742a] text-white"
                        : "bg-white border-[#ffe9d6] text-[#281a0e] hover:border-[#e8742a]/50"
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
                onClick={() => router.back()}
                className="flex-1 h-12 px-6 bg-white rounded-xl border border-[#ffe9d6] flex justify-center items-center hover:bg-[#fff8f3] hover:border-[#e8742a]/50 transition-colors"
              >
                <span className="text-[#6b7280] text-base font-semibold leading-6">취소</span>
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 h-12 px-6 bg-[#e8742a] rounded-xl flex justify-center items-center hover:bg-[#d4621a] transition-colors"
              >
                <span className="text-white text-base font-semibold leading-6">등록하기</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
