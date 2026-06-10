"use client";

import { useState } from "react";
import { Camera, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";

const SERVICES = [
  { id: "visit", emoji: "🏠", title: "방문돌봄", desc: "보호자님 집에서 돌봄" },
  { id: "foster", emoji: "🏡", title: "위탁돌봄", desc: "내 집에서 돌봄" },
  { id: "walk", emoji: "🚶", title: "산책", desc: "반려동물 산책 서비스" },
  { id: "hotel", emoji: "🏨", title: "펫호텔", desc: "장기 위탁 돌봄" },
];

const ANIMALS = [
  { id: "small", label: "소형견 (7kg 이하)" },
  { id: "medium", label: "중형견 (7-15kg)" },
  { id: "large", label: "대형견 (15kg 이상)" },
  { id: "cat", label: "고양이" },
];

const CAREER_OPTIONS = [
  { value: "없음", label: "경력 없음" },
  { value: "1년 미만", label: "1년 미만" },
  { value: "1~3년", label: "1~3년" },
  { value: "3~5년", label: "3~5년" },
  { value: "5년 이상", label: "5년 이상" },
];

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
];

const labelCls = "text-stone-900 text-sm font-medium leading-5 block";

function CheckboxCard({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="p-3 bg-white rounded-lg border border-[#ffe9d6] flex items-center gap-3 hover:border-[#e8742a]/50 transition-all text-left"
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-[#e8742a] border-[#e8742a]" : "border-gray-300"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
      </div>
      <span className="text-stone-900 text-sm font-normal leading-5">
        {label}
      </span>
    </button>
  );
}

export default function PetsitterRegisterPage() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [intro, setIntro] = useState("");
  const [career, setCareer] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);

  const toggleItem = (
    id: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(list.includes(id) ? list.filter((s) => s !== id) : [...list, id]);
  };

  return (
    <>
      <Header />

      {/* 진행 바 */}
      <div className="w-full h-1 bg-orange-100">
        <div
          className="h-1 bg-orange-500 transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <main className="flex-1 bg-[#fff8f3] min-h-screen pb-28">
        <div className="max-w-205 mx-auto px-6 pt-10">
          {/* 페이지 헤더 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl border border-[#ffe9d6] flex items-center justify-center text-[#281a0e] hover:bg-[#fff8f3] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-[#281a0e]">펫시터 등록</h1>
          </div>

          {/* 단계별 컨텐츠 */}
          <div className="flex flex-col gap-4 pt-8">
            {/* ── 단계 1: 기본 정보 ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                <h2 className="text-lg font-semibold text-[#281a0e]">
                  기본 정보를 입력해주세요
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  펫시터로 활동하기 위한 정보를 입력합니다
                </p>

                <div className="mt-6">
                  <label className={labelCls}>프로필 사진</label>
                  <button className="mt-3 w-24 h-24 bg-[#fff8f3] rounded-full border border-[#ffe9d6] flex items-center justify-center hover:bg-orange-100 transition-colors">
                    <Camera className="w-7 h-7 text-gray-500" strokeWidth={2} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <label className={`${labelCls} mb-2`}>이름 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="실명을 입력하세요"
                      className="w-full h-12 px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 placeholder:text-gray-400 focus:outline-none focus:border-[#e8742a] transition-all"
                    />
                  </div>
                  <div>
                    <label className={`${labelCls} mb-2`}>활동 지역 *</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full h-12 px-4 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 focus:outline-none focus:border-[#e8742a] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">지역을 선택하세요</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className={`${labelCls} mb-2`}>자기소개 *</label>
                  <textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value.slice(0, 500))}
                    placeholder="펫시터 경력, 반려동물 돌봄 경험 등을 작성해주세요"
                    rows={6}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 placeholder:text-stone-900/50 leading-6 resize-none focus:outline-none focus:border-[#e8742a] transition-all"
                  />
                  <div className="flex justify-end pt-1">
                    <span className="text-gray-400 text-xs font-normal leading-4">
                      {intro.length}/500
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <label className={`${labelCls} mb-2`}>경력 *</label>
                  <select
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 focus:outline-none focus:border-[#e8742a] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">펫시터 경력 선택</option>
                    {CAREER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── 단계 2: 서비스 선택 ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#281a0e]">
                    제공 서비스를 선택해주세요
                  </h2>
                  <span className="text-xs text-gray-500">중복 선택 가능</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  제공 가능한 서비스를 모두 선택하세요
                </p>

                <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-4">
                  {SERVICES.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() =>
                          toggleItem(
                            service.id,
                            selectedServices,
                            setSelectedServices,
                          )
                        }
                        className={`p-4 bg-white rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-[#e8742a] bg-[#fff8f3]"
                            : "border-[#ffe9d6] hover:border-[#e8742a]/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl leading-9">
                            {service.emoji}
                          </span>
                          <div>
                            <p
                              className={`text-base font-semibold leading-6 ${
                                isSelected ? "text-[#e8742a]" : "text-stone-900"
                              }`}
                            >
                              {service.title}
                            </p>
                            <p className="text-gray-500 text-sm font-normal leading-5 pt-1">
                              {service.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 단계 3: 자격증 등록 ── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                <h2 className="text-stone-900 text-xl font-bold leading-7">
                  자격증을 등록해주세요
                </h2>
                <p className="text-gray-500 text-sm font-normal leading-5 pt-2">
                  선택사항이지만 신뢰도를 높일 수 있습니다
                </p>

                <button className="mt-6 w-full h-28 rounded-2xl outline-2 outline-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
                  <Camera className="w-8 h-8 text-gray-500" strokeWidth={2} />
                  <span className="text-gray-500 text-sm font-normal leading-5">
                    자격증 파일 추가
                  </span>
                </button>

                <div className="pt-6">
                  <label className={`${labelCls} mb-3`}>돌봄 가능 동물</label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    {ANIMALS.map((animal) => (
                      <CheckboxCard
                        key={animal.id}
                        label={animal.label}
                        checked={selectedAnimals.includes(animal.id)}
                        onToggle={() =>
                          toggleItem(
                            animal.id,
                            selectedAnimals,
                            setSelectedAnimals,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-6 pb-6">
                  <label className={`${labelCls} mb-3`}>활동 사진</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200"
                      />
                    ))}
                    <button className="w-full aspect-square rounded-xl outline-2 outline-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors">
                      <Plus className="w-6 h-6 text-gray-500" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 bg-white border-t border-[#ffe9d6] z-10">
        <div className="max-w-205 mx-auto flex items-center justify-between h-19 px-6">
          <button
            type="button"
            onClick={() =>
              step > 1 ? setStep((s) => s - 1) : window.history.back()
            }
            className="h-11 px-6 rounded-xl border border-[#ffe9d6] flex items-center gap-1.5 text-gray-500 text-[15px] font-medium hover:bg-[#fff8f3] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>

          <span className="text-sm text-gray-500">{step} / 3</span>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="h-11 px-6 rounded-xl bg-[#e8742a] text-white text-[15px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              다음 단계
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => console.log("등록 완료")}
              className="h-11 px-6 rounded-xl bg-[#e8742a] text-white text-[15px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              등록 완료
            </button>
          )}
        </div>
      </div>
    </>
  );
}
