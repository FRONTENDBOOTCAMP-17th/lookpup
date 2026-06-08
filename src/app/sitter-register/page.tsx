"use client";

import { useState } from "react";
import { Bell, Camera, Plus, Check } from "lucide-react";

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

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <h2 className="text-stone-900 text-xl font-bold leading-7">{title}</h2>
      <p className="text-gray-500 text-sm font-normal leading-5 pt-2">{desc}</p>
    </>
  );
}

function StepButtons({
  onPrev,
  onNext,
  nextLabel = "다음",
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="pt-6 border-t border-orange-100 flex gap-3">
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 h-12 px-6 bg-white rounded-[10px] outline-1 outline-orange-500 flex justify-center items-center hover:bg-orange-50 transition-colors"
        >
          <span className="text-orange-500 text-base font-semibold leading-6">
            이전
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="flex-1 h-12 px-6 bg-orange-500 rounded-[10px] flex justify-center items-center hover:bg-orange-600 active:bg-orange-700 transition-colors"
      >
        <span className="text-white text-base font-semibold leading-6">
          {nextLabel}
        </span>
      </button>
    </div>
  );
}

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
      className="p-3 bg-white rounded-lg outline-1 outline-orange-100 flex items-center gap-3 hover:outline-orange-300 transition-all text-left"
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-orange-500" : "bg-white outline-1 outline-orange-200"
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
    <div className="min-h-screen bg-orange-50 flex flex-col font-['Pretendard']">
      {/* 헤더 */}
      <header className="w-full bg-white shadow-[0px_1px_8px_0px_rgba(232,116,42,0.08)] border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex justify-between items-center">
          <span className="text-orange-500 text-xl font-bold leading-9">
            봐주개 🐾
          </span>

          <nav className="flex items-center gap-8">
            {["펫시터 찾기", "구인게시판", "서비스 소개"].map((label) => (
              <span
                key={label}
                className="text-gray-500 text-base font-medium leading-6 cursor-pointer hover:text-orange-500 transition-colors"
              >
                {label}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 rounded-full hover:bg-orange-50 transition-colors flex items-center">
              <Bell className="w-5 h-5 text-gray-500" strokeWidth={1.67} />
              <span className="-ml-1.5 -mt-3.5 w-5 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium leading-4">
                  3
                </span>
              </span>
            </button>
            <div className="w-10 h-10 bg-orange-50 rounded-full outline-1 outline-orange-100 flex items-center justify-center">
              <span className="text-orange-500 text-base font-semibold leading-6">
                김
              </span>
            </div>
            <button className="h-9 px-4 bg-orange-500 rounded-[10px] flex items-center gap-2 hover:bg-orange-600 transition-colors">
              <span className="text-white text-xs font-semibold leading-5">
                채팅
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 진행 바 */}
      <div className="w-full h-1 bg-orange-100">
        <div
          className="h-1 bg-orange-500 transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex justify-center py-6 md:py-8 lg:py-12 px-4">
        <div className="w-full max-w-200">
          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] outline-1 outline-orange-100 p-4 sm:p-5">
            <div className="flex justify-between items-center">
              <h1 className="text-stone-900 text-2xl font-bold leading-8">
                펫시터 등록
              </h1>
              <span className="text-gray-500 text-sm font-medium leading-5">
                단계 {step}/3
              </span>
            </div>

            {/* ── 단계 1: 기본 정보 ── */}
            {step === 1 && (
              <div className="pt-8 flex flex-col">
                <StepHeader
                  title="기본 정보를 입력해주세요"
                  desc="펫시터로 활동하기 위한 정보를 입력합니다"
                />

                <div className="pt-6">
                  <label className={labelCls}>프로필 사진</label>
                  <button className="mt-3 w-24 h-24 bg-orange-50 rounded-full outline-1 outline-orange-100 flex items-center justify-center hover:bg-orange-100 transition-colors">
                    <Camera className="w-7 h-7 text-gray-500" strokeWidth={2} />
                  </button>
                </div>

                <div className="pt-6 grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <label className={`${labelCls} mb-2`}>이름 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="실명을 입력하세요"
                      className="w-full h-12 px-4 py-3 bg-white rounded-[10px] outline-1 outline-orange-100 text-base font-normal text-gray-500 placeholder:text-gray-400 focus:outline-orange-400 focus:outline-2 transition-all"
                    />
                  </div>
                  <div>
                    <label className={`${labelCls} mb-2`}>활동 지역 *</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full h-12 px-4 bg-white rounded-lg border border-orange-100 text-base font-normal text-gray-500 focus:outline-none focus:border-orange-400 transition-all appearance-none cursor-pointer"
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

                <div className="pt-6">
                  <label className={`${labelCls} mb-2`}>자기소개 *</label>
                  <textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value.slice(0, 500))}
                    placeholder="펫시터 경력, 반려동물 돌봄 경험 등을 작성해주세요"
                    rows={6}
                    className="w-full px-4 py-3 bg-white rounded-lg outline-1 outline-orange-100 text-base font-normal text-stone-900 placeholder:text-stone-900/50 leading-6 resize-none focus:outline-orange-400 focus:outline-2 transition-all"
                  />
                  <div className="flex justify-end pt-1">
                    <span className="text-gray-500 text-xs font-normal leading-4">
                      {intro.length}/500
                    </span>
                  </div>
                </div>

                <div className="pt-2 pb-6">
                  <label className={`${labelCls} mb-2`}>경력 *</label>
                  <select
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="w-full h-11 px-4 bg-white rounded-lg outline-1 outline-orange-100 text-base font-normal text-stone-900/50 focus:outline-none focus:outline-orange-400 focus:outline-2 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">▼ 펫시터 경력</option>
                    {CAREER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <StepButtons onNext={() => setStep(2)} />
              </div>
            )}

            {/* ── 단계 2: 서비스 선택 ── */}
            {step === 2 && (
              <div className="pt-8 flex flex-col">
                <StepHeader
                  title="제공 서비스를 선택해주세요"
                  desc="제공 가능한 서비스를 모두 선택하세요"
                />

                <div className="pt-6 grid grid-cols-1 xs:grid-cols-2 gap-4 pb-6">
                  {SERVICES.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        onClick={() =>
                          toggleItem(
                            service.id,
                            selectedServices,
                            setSelectedServices,
                          )
                        }
                        className={`p-4 bg-white rounded-xl text-left transition-all ${
                          isSelected
                            ? "outline-2 outline-orange-500 shadow-[0px_2px_8px_0px_rgba(232,116,42,0.15)]"
                            : "outline-2 outline-orange-100 hover:outline-orange-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl leading-9">
                            {service.emoji}
                          </span>
                          <div>
                            <p className="text-stone-900 text-base font-semibold leading-6">
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

                <StepButtons
                  onPrev={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              </div>
            )}

            {/* ── 단계 3: 자격증 등록 ── */}
            {step === 3 && (
              <div className="pt-8 flex flex-col">
                <StepHeader
                  title="자격증을 등록해주세요"
                  desc="선택사항이지만 신뢰도를 높일 수 있습니다"
                />

                <button className="mt-6 w-full h-28 rounded-2xl outline-2 outline-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
                  <Camera className="w-8 h-8 text-gray-500" strokeWidth={2} />
                  <span className="text-gray-500 text-sm font-normal leading-5">
                    자격증 사진 추가
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

                <StepButtons
                  onPrev={() => setStep(2)}
                  onNext={() => console.log("등록 완료")}
                  nextLabel="등록 완료"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
