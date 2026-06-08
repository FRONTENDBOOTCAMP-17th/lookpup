"use client";

import { useState, useRef } from "react";

const COMMON_NOTES = ["알러지 있음", "약 복용 중", "사람 경계", "다른 동물 경계", "분리불안"];

export default function PetRegisterPage() {
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

  const handleSubmit = () => {
    if (!petType) { alert("동물 종류를 선택해주세요."); return; }
    if (!name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!gender) { alert("성별을 선택해주세요."); return; }
    alert("반려동물이 등록되었습니다!");
  };

  const inputCls = "w-full h-12 px-4 py-3 bg-white rounded-[10px] outline-1 -outline-offset-1 outline-orange-100 text-base font-normal font-['Pretendard'] text-stone-900 placeholder-gray-500 focus:outline-orange-500 focus:outline-2 transition-all";
  const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  return (
    <div className="w-full min-h-screen bg-orange-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-[0px_1px_8px_0px_rgba(232,116,42,0.08)] border-b border-orange-100 flex justify-center">
        <div className="w-full max-w-[1280px] h-16 px-10 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-orange-500 text-xl font-bold font-['Pretendard'] leading-9">봐주개</span>
            <span className="text-orange-500 text-xl font-bold font-['Pretendard'] leading-9">🐾</span>
          </div>

          <nav className="flex items-center gap-8">
            <button className="h-7 border-b border-orange-500 text-orange-500 text-base font-medium font-['Pretendard'] leading-6">
              펫시터 찾기
            </button>
            <button className="text-gray-500 text-base font-medium font-['Pretendard'] leading-6">
              구인게시판
            </button>
            <button className="text-gray-500 text-base font-medium font-['Pretendard'] leading-6">
              서비스 소개
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6z" stroke="#6B7280" strokeWidth="1.67" strokeLinejoin="round" />
                <path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" stroke="#6B7280" strokeWidth="1.67" />
              </svg>
              <span className="absolute top-[-4px] right-[-4px] min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex justify-center items-center text-white text-xs font-medium font-['Pretendard'] leading-4">
                3
              </span>
            </button>

            <div className="w-10 h-10 bg-orange-50 rounded-full outline-1 outline-orange-100 flex justify-center items-center">
              <span className="text-orange-500 text-base font-semibold font-['Pretendard'] leading-6">김</span>
            </div>

            <button className="h-9 px-4 bg-orange-500 rounded-[10px] flex justify-center items-center">
              <span className="text-white text-xs font-semibold font-['Pretendard'] leading-5">채팅</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-[800px]">
          <div className="w-full p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] outline-1 outline-orange-100 flex flex-col">

            <h1 className="text-stone-900 text-2xl font-bold font-['Pretendard'] leading-8">반려동물 등록</h1>

            {/* Photos */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">사진</label>
              <div className="pt-3 flex items-start gap-3 overflow-x-auto">
                {photos.map(({ url }, i) => (
                  <div key={url} className="relative shrink-0 w-32 h-32 rounded-2xl overflow-hidden outline-1 outline-orange-100">
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
                    style={{ width: '128px', height: '128px', minWidth: '128px' }}
                    className="shrink-0 bg-orange-50 rounded-2xl outline-1 outline-orange-100 flex flex-col justify-center items-center gap-2"
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0">
                      <rect x="2.67" y="8" width="26.67" height="18.67" rx="2" stroke="#6B7280" strokeWidth="2.67" />
                      <circle cx="16" cy="17.33" r="4" stroke="#6B7280" strokeWidth="2.67" />
                      <path d="M11.33 8l1.34-2.67h6.66L20.67 8" stroke="#6B7280" strokeWidth="2.67" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-500 text-xs font-normal font-['Pretendard'] leading-4">사진 추가</span>
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
              <p className="pt-2 text-gray-500 text-xs font-normal font-['Pretendard'] leading-4">최대 5장까지 업로드 가능</p>
            </section>

            {/* Pet Type */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">동물 종류</label>
              <div className="pt-3 flex gap-3">
                {([["dog", "🐕", "강아지"], ["cat", "🐈", "고양이"]] as const).map(([type, emoji, label]) => (
                  <button
                    key={type}
                    onClick={() => setPetType(type)}
                    className={`flex-1 p-4 rounded-xl outline-1 -outline-offset-1 flex flex-col items-center gap-2 transition-colors ${
                      petType === type ? "bg-orange-50 outline-orange-500" : "bg-white outline-orange-100"
                    }`}
                  >
                    <span className="text-3xl leading-9">{emoji}</span>
                    <span className={`text-base font-medium font-['Pretendard'] leading-6 ${petType === type ? "text-orange-500" : "text-stone-900"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Name */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">이름</label>
              <div className="pt-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="반려동물 이름을 입력하세요"
                  className={inputCls}
                />
              </div>
            </section>

            {/* Breed */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">품종</label>
              <div className="pt-2">
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="품종을 입력하세요"
                  className="w-full h-11 px-4 bg-white rounded-lg outline-1 -outline-offset-1 outline-orange-100 text-base font-normal font-['Pretendard'] text-stone-900 placeholder-gray-500 focus:outline-orange-500 focus:outline-2 transition-all"
                />
              </div>
            </section>

            {/* Age & Weight */}
            <section className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">나이</label>
                  <div className="pt-2">
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
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">체중 (kg)</label>
                  <div className="pt-2">
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
              </div>
            </section>

            {/* Gender */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">성별</label>
              <div className="pt-3 flex gap-3">
                {([["male", "남아"], ["female", "여아"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setGender(value)}
                    className={`flex-1 h-12 rounded-lg outline-1 -outline-offset-1 flex justify-center items-center transition-colors ${
                      gender === value ? "bg-orange-50 outline-orange-500" : "bg-white outline-orange-100"
                    }`}
                  >
                    <span className={`text-sm font-medium font-['Pretendard'] leading-5 ${gender === value ? "text-orange-500" : "text-stone-900"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Neutered */}
            <section className="pt-6">
              <button
                onClick={() => setNeutered((v) => !v)}
                className={`w-full h-14 px-4 rounded-xl outline-1 -outline-offset-1 flex items-center gap-3 transition-colors ${
                  neutered ? "bg-orange-50 outline-orange-500" : "bg-white outline-orange-100"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center outline-1 transition-colors ${
                  neutered ? "bg-orange-500 outline-orange-500" : "bg-white outline-orange-200"
                }`}>
                  {neutered && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">중성화 수술 완료</span>
              </button>
            </section>

            {/* Notes */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5 pb-2">특이사항</label>
              <textarea
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setNotes(e.target.value);
                }}
                placeholder="알러지, 질병, 주의사항 등을 입력해주세요"
                style={{ height: '120px' }}
                className="w-full px-4 py-3 bg-white rounded-lg outline-1 -outline-offset-1 outline-orange-100 text-base font-normal font-['Pretendard'] leading-6 text-stone-900 placeholder-stone-900/50 resize-none focus:outline-orange-500 focus:outline-2 transition-all"
              />
              <div className="pt-1 flex justify-end">
                <span className="text-gray-500 text-xs font-normal font-['Pretendard'] leading-4">{notes.length}/500</span>
              </div>
            </section>

            {/* Common Notes Tags */}
            <section className="pt-6 flex flex-col">
              <label className="text-stone-900 text-sm font-medium font-['Pretendard'] leading-5">자주 선택되는 특이사항</label>
              <div className="pt-3 flex flex-wrap gap-2">
                {COMMON_NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => toggleNote(note)}
                    className={`h-9 px-4 rounded-full outline-1 -outline-offset-1 text-xs font-medium font-['Pretendard'] leading-4 transition-colors ${
                      selectedNotes.includes(note)
                        ? "bg-orange-500 outline-orange-500 text-white"
                        : "bg-white outline-orange-100 text-stone-900"
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
                onClick={() => window.history.back()}
                className="flex-1 h-12 px-6 bg-white rounded-[10px] outline-1 -outline-offset-1 outline-orange-500 flex justify-center items-center hover:bg-orange-50 transition-colors"
              >
                <span className="text-orange-500 text-base font-semibold font-['Pretendard'] leading-6">취소</span>
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 h-12 px-6 bg-orange-500 rounded-[10px] flex justify-center items-center hover:bg-orange-600 transition-colors"
              >
                <span className="text-white text-base font-semibold font-['Pretendard'] leading-6">등록하기</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
