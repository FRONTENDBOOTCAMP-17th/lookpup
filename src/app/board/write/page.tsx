"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, useDayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Home,
  Heart,
  PawPrint,
  Moon,
  Car,
  MoreHorizontal,
  Save,
  Send,
  MapPin,
  LocateFixed,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";

const STEPS = ["서비스 선택", "날짜·장소", "반려동물", "상세 내용"];

const SERVICE_TYPES = [
  { label: "방문 돌봄", icon: Home, value: "care" },
  { label: "위탁 돌봄", icon: Heart, value: "foster" },
  { label: "산책", icon: PawPrint, value: "walk" },
  { label: "펫 호텔", icon: Moon, value: "hotel" },
  { label: "픽업 서비스", icon: Car, value: "pickup" },
  { label: "기타", icon: MoreHorizontal, value: "other" },
];

const BUDGET_PRESETS = [10000, 20000, 30000, 50000];

const DUMMY_PETS = [
  { id: "1", name: "몽이", type: "강아지", age: 3, weight: 5.2, emoji: "🐶" },
  { id: "2", name: "나비", type: "고양이", age: 5, weight: 3.8, emoji: "🐱" },
];

const LOCATION_TABS = ["우리 집", "펫시터 집", "직접 입력"];

const TEMPLATES = [
  {
    label: "기본 산책 요청",
    text: "안녕하세요! 저희 아이 산책을 부탁드리고 싶어요.\n\n- 산책 시간: \n- 산책 코스/장소: \n- 주의사항: \n\n잘 부탁드립니다 :)",
  },
  {
    label: "장기 위탁 문의",
    text: "안녕하세요. 장기 위탁 돌봄을 문의드립니다.\n\n- 위탁 기간: \n- 식사/배변 습관: \n- 특이사항(질병·약 등): \n\n연락 기다리겠습니다.",
  },
  {
    label: "픽업 서비스",
    text: "안녕하세요. 픽업 서비스를 요청드립니다.\n\n- 픽업 장소: \n- 도착지: \n- 희망 시간: \n\n감사합니다.",
  },
];

const SITTER_CONDITIONS = [
  "인증 펫시터만 (Badge 보유자 우선)",
  "여성 펫시터 선호",
  "반려동물 자격증 보유자 우선",
  "흡연자 제외",
];

type FormState = {
  service_type: string;
  budget: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  start_time: string;
  end_time: string;
  location_type: string;
  location: string;
  selected_pets: string[];
  title: string;
  content: string;
  conditions: string[];
};

// 달력 헤더 커스텀 컴포넌트 — 디자인 시안 기준
// ChevronLeft/Right 아이콘, text-stone-900 / text-gray-500 Tailwind 컬러 사용
function CalendarCaption({ calendarMonth }: { calendarMonth: { date: Date } }) {
  const { goToMonth, nextMonth, previousMonth } = useDayPicker();
  return (
    <div className="w-full flex justify-between items-center">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="p-1 rounded-lg inline-flex flex-col justify-start items-start disabled:opacity-30"
      >
        <div className="size-4 relative overflow-hidden flex items-center justify-center">
          <ChevronLeft className="w-2.5 h-2.5 text-gray-500" />
        </div>
      </button>
      <div className="h-5 relative flex items-center justify-center">
        <span className="text-stone-900 text-sm font-normal leading-5 whitespace-nowrap">
          {format(calendarMonth.date, "yyyy년 M월", { locale: ko })}
        </span>
      </div>
      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="p-1 rounded-lg inline-flex flex-col justify-start items-start disabled:opacity-30"
      >
        <div className="size-4 relative overflow-hidden flex items-center justify-center">
          <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
        </div>
      </button>
    </div>
  );
}

// 오늘 날짜 주황 링 스타일 (Anima 시안 기준)
const todayStyle: React.CSSProperties = {
  fontWeight: "bold",
  color: "#e8742a",
  boxShadow: "0 0 0 1px #e8742a",
  borderRadius: "50%",
  backgroundColor: "transparent",
};

// react-day-picker v10 CSS 변수 — 셀 너비 43px (Anima 기준)
const calendarVars = {
  "--rdp-accent-color": "#e8742a",
  "--rdp-accent-background-color": "#fff8f3",
  "--rdp-day-width": "2.6875rem",
  "--rdp-day-height": "2rem",
  "--rdp-day_button-width": "2.6875rem",
  "--rdp-day_button-height": "2rem",
  fontSize: "0.875rem",
} as React.CSSProperties;

export default function BoardWritePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    service_type: "",
    budget: "",
    startDate: undefined,
    endDate: undefined,
    start_time: "",
    end_time: "",
    location_type: "우리 집",
    location: "",
    selected_pets: [],
    title: "",
    content: "",
    conditions: [],
  });

  const canNext = () => {
    if (step === 1) return !!form.service_type;
    if (step === 2) return !!form.startDate;
    if (step === 3) return form.selected_pets.length > 0;
    if (step === 4) return !!form.title.trim() && !!form.content.trim();
    return false;
  };

  const togglePet = (id: string) =>
    setForm((prev) => ({
      ...prev,
      selected_pets: prev.selected_pets.includes(id)
        ? prev.selected_pets.filter((p) => p !== id)
        : [...prev.selected_pets, id],
    }));

  const toggleCondition = (condition: string) =>
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/auth/login");
      return;
    }
    const { error } = await supabase.from("requests").insert({
      title: form.title,
      content: form.content,
      request_type: form.service_type,
      location: form.location || form.location_type,
      start_datetime: form.startDate ?? null,
      end_datetime: form.endDate ?? null,
      budget: form.budget ? parseInt(form.budget) : null,
      owner_id: user.id,
      status: "open",
    });
    if (error) {
      alert("글 작성에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }
    router.push("/board");
  };

  return (
    <>
      <Header />

      <main className="flex-1 bg-[#fff8f3] min-h-screen pb-28">
        <div className="max-w-205 mx-auto px-4 sm:px-6 pt-10">
          {/* 페이지 헤더 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl border border-[#ffe9d6] flex items-center justify-center text-[#281a0e] hover:bg-[#fff8f3] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-[#281a0e]">
                돌봄 요청 게시글 작성
              </h1>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button className="h-10 px-5 rounded-xl border border-[#ffe9d6] text-gray-500 text-[15px] font-medium flex items-center gap-1.5 hover:bg-[#fff8f3] transition-colors">
                <Save className="w-3.75 h-3.75" />
                임시저장
              </button>
              <button
                onClick={step === 4 ? handleSubmit : undefined}
                disabled={step !== 4 || !canNext() || isSubmitting}
                className={`h-10 px-5 rounded-xl text-[15px] font-semibold flex items-center gap-1.5 bg-[#e8742a] text-white transition-opacity ${
                  step === 4 && canNext() && !isSubmitting
                    ? "opacity-100"
                    : "opacity-40"
                }`}
              >
                <Send className="w-3.75 h-3.75" />
                {isSubmitting ? "등록 중..." : "게시하기"}
              </button>
            </div>
          </div>

          {/* 스텝 인디케이터 */}
          <div className="flex items-start w-full pt-8">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <Fragment key={label}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        isActive || isDone
                          ? "bg-[#e8742a] text-white"
                          : "border-2 border-[#ffe9d6] text-gray-500"
                      }`}
                    >
                      {isDone ? <Check className="size-3.5" /> : num}
                    </div>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isActive
                          ? "font-bold text-[#281a0e]"
                          : "font-normal text-gray-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mt-4 mx-2 ${isDone ? "bg-[#e8742a]" : "bg-[#ffe9d6]"}`}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* 단계별 콘텐츠 */}
          <div className="flex flex-col gap-4 pt-8">
            {/* ====== Step 1: 서비스 선택 ====== */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#281a0e]">
                    어떤 돌봄이 필요하신가요?
                  </h2>
                  <span className="text-xs text-gray-500">중복 선택 가능</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {SERVICE_TYPES.map(({ label, icon: Icon, value }) => {
                    const selected = form.service_type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, service_type: value }))
                        }
                        className={`flex flex-col items-center justify-center gap-2 h-25 rounded-xl border transition-all ${
                          selected
                            ? "border-[#e8742a] bg-[#fff8f3]"
                            : "border-[#ffe9d6] bg-white hover:border-[#e8742a]/50"
                        }`}
                      >
                        <Icon
                          className={`w-5.5 h-5.5 ${selected ? "text-[#e8742a]" : "text-[#281a0e]"}`}
                        />
                        <span
                          className={`text-sm font-medium ${selected ? "text-[#e8742a]" : "text-[#281a0e]"}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#ffe9d6] mt-6 pt-6">
                  <h3 className="text-lg font-semibold text-[#281a0e]">
                    예산을 입력해주세요
                  </h3>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-80 h-12 flex items-center px-4 border border-[#ffe9d6] rounded-xl overflow-hidden">
                      <input
                        type="number"
                        value={form.budget}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            budget: e.target.value,
                          }))
                        }
                        placeholder="0"
                        min={0}
                        className="w-full text-lg text-gray-500 placeholder:text-gray-500 outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-[15px] font-medium text-[#281a0e]">
                      원
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {BUDGET_PRESETS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            budget: String(amount),
                          }))
                        }
                        className={`h-8.5 px-4 rounded-full border text-sm transition-colors ${
                          form.budget === String(amount)
                            ? "bg-[#e8742a] text-white border-[#e8742a]"
                            : "bg-[#fff8f3] text-[#281a0e] border-[#ffe9d6] hover:border-[#e8742a]/50"
                        }`}
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, budget: "" }))
                      }
                      className="h-8.5 px-4 rounded-full border bg-[#fff8f3] text-[#281a0e] border-[#ffe9d6] text-sm hover:border-[#e8742a]/50 transition-colors"
                    >
                      협의 가능
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ====== Step 2: 날짜·장소 ====== */}
            {step === 2 && (
              <>
                {/* 날짜·시간 카드 */}
                <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
                  <h2 className="text-lg font-semibold text-[#281a0e]">
                    날짜 · 시간
                  </h2>

                  {/* TODO: 추후 공통 컴포넌트로 교체 예정 */}
                  {/* 달력 2개 — 모바일: 세로 배치, sm 이상: 가로 배치 */}
                  <div
                    className="flex flex-col sm:flex-row sm:flex-nowrap items-start gap-4 pt-5"
                    style={calendarVars}
                  >
                    {/* 시작일 */}
                    <div className="flex flex-col items-start w-full sm:flex-1">
                      <span className="text-sm font-semibold text-gray-500">
                        시작일
                      </span>
                      <div className="mt-2 w-full bg-white rounded-2xl border border-[#ffe9d6] p-2 sm:p-4 overflow-hidden">
                        <DayPicker
                          mode="single"
                          selected={form.startDate}
                          onSelect={(d) =>
                            setForm((prev) => ({
                              ...prev,
                              startDate: d,
                              endDate:
                                prev.endDate && d && prev.endDate < d
                                  ? undefined
                                  : prev.endDate,
                            }))
                          }
                          locale={ko}
                          disabled={{ before: new Date() }}
                          modifiersStyles={{ today: todayStyle }}
                          components={{
                            MonthCaption: CalendarCaption,
                            Nav: () => <></>,
                          }}
                        />
                      </div>
                    </div>

                    {/* ~ 구분자 — sm 이상에서만 표시 */}
                    <span className="hidden sm:block pt-16 shrink-0 text-gray-500 text-lg font-medium">
                      ~
                    </span>

                    {/* 종료일 */}
                    <div className="flex flex-col items-start w-full sm:flex-1">
                      <span className="text-sm font-semibold text-gray-500">
                        종료일
                      </span>
                      <div className="mt-2 w-full bg-white rounded-2xl border border-[#ffe9d6] p-2 sm:p-4 overflow-hidden">
                        <DayPicker
                          mode="single"
                          selected={form.endDate}
                          onSelect={(d) =>
                            setForm((prev) => ({ ...prev, endDate: d }))
                          }
                          locale={ko}
                          disabled={{ before: form.startDate ?? new Date() }}
                          modifiersStyles={{ today: todayStyle }}
                          components={{
                            MonthCaption: CalendarCaption,
                            Nav: () => <></>,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 시간 입력 — Anima: h-[98px] items-center gap-4 pt-6 */}
                  <div className="flex items-center gap-4 pt-6 h-24">
                    {/* 시작 시간 */}
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-sm text-gray-500 pb-1.5">
                        시작 시간
                      </span>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            start_time: e.target.value,
                          }))
                        }
                        className={`h-12 w-full px-4 bg-white border border-[#ffe9d6] rounded-xl outline-none focus:border-[#e8742a] transition ${
                          form.start_time
                            ? "text-[#281a0e]"
                            : "text-transparent"
                        }`}
                      />
                    </div>

                    {/* ~ 구분자 — Anima: items-start pt-4 → 인풋 높이 중간쯤 */}
                    <span className="shrink-0 text-gray-500 text-[15px] self-end pb-3">
                      ~
                    </span>

                    {/* 종료 시간 */}
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-sm text-gray-500 pb-1.5">
                        종료 시간
                      </span>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            end_time: e.target.value,
                          }))
                        }
                        className={`h-12 w-full px-4 bg-white border border-[#ffe9d6] rounded-xl outline-none focus:border-[#e8742a] transition ${
                          form.end_time ? "text-[#281a0e]" : "text-transparent"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 돌봄 장소 카드 */}
                <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                  <h2 className="text-lg font-semibold text-[#281a0e]">
                    돌봄 장소
                  </h2>

                  <div className="flex gap-2 mt-4">
                    {LOCATION_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, location_type: tab }))
                        }
                        className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
                          form.location_type === tab
                            ? "bg-[#e8742a] text-white"
                            : "border border-[#ffe9d6] text-gray-500 bg-white hover:bg-[#fff8f3]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-3">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="주소 검색"
                      className="w-full h-12 pl-9 pr-4 bg-white border border-[#ffe9d6] rounded-xl text-[#281a0e] placeholder:text-gray-400 outline-none focus:border-[#e8742a] transition"
                    />
                  </div>

                  {/* 지도 플레이스홀더 */}
                  <div
                    className="relative w-full h-56 rounded-xl overflow-hidden border border-[#ffe9d6] flex items-center justify-center mt-3"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right,rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,0.04) 1px,transparent 1px)",
                      backgroundSize: "32px 32px",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-9 h-9 bg-[#e8742a] rounded-full flex items-center justify-center shadow-md">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-xs text-[#281a0e] shadow-sm">
                        위치를 검색해주세요
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[#e8742a] text-sm font-medium mt-3 hover:opacity-80 transition-opacity"
                  >
                    <LocateFixed className="w-4 h-4" />
                    현재 위치 사용
                  </button>
                </div>
              </>
            )}

            {/* ====== Step 3: 반려동물 ====== */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                <h2 className="text-xl font-bold text-[#281a0e] mb-1">
                  함께할 반려동물을 선택해주세요
                </h2>
                <p className="text-gray-400 text-sm mb-5">
                  등록된 반려동물 중 선택하거나 새로 등록하세요
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {DUMMY_PETS.map((pet) => {
                    const isSelected = form.selected_pets.includes(pet.id);
                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => togglePet(pet.id)}
                        className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                          isSelected
                            ? "border-[#e8742a]"
                            : "border-[#ffe9d6] hover:border-[#e8742a]/50"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#e8742a] rounded-full flex items-center justify-center z-10">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="relative bg-[#fff8f3] py-7 flex items-center justify-center">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white border border-[#ffe9d6] rounded-full text-xs font-medium text-[#e8742a]">
                            {pet.type}
                          </span>
                          <span className="text-5xl">{pet.emoji}</span>
                        </div>
                        <div className="py-3 text-center">
                          <div className="text-[#281a0e] text-base font-bold">
                            {pet.name}
                          </div>
                          <div className="text-gray-400 text-xs mt-0.5">
                            {pet.age}살 · {pet.weight}kg
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => router.push("/pet-register")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ffe9d6] hover:border-[#e8742a]/50 transition-colors text-gray-400 hover:text-[#e8742a] min-h-35"
                  >
                    <div className="w-10 h-10 bg-[#fff8f3] rounded-full flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      새 반려동물 등록
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ====== Step 4: 상세 내용 ====== */}
            {step === 4 && (
              <>
                <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-[#281a0e]">
                        게시글 제목
                      </label>
                      <span className="text-xs text-gray-400">
                        {form.title.length} / 50
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => {
                        if (e.target.value.length <= 50)
                          setForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }));
                      }}
                      placeholder="예: 이번 주말 강아지 산책 펫시터 구해요"
                      className="w-full h-12 px-4 bg-white border border-[#ffe9d6] rounded-xl text-[#281a0e] placeholder:text-gray-400 outline-none focus:border-[#e8742a] transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-[#281a0e]">
                        상세 내용
                      </label>
                      <span className="text-xs text-gray-400">
                        {form.content.length} / 500
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 -mt-1">
                      펫시터에게 전달할 내용을 자유롭게 작성하세요
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">
                        템플릿으로 시작하기
                      </span>
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              content: t.text.slice(0, 500),
                            }))
                          }
                          className="px-3 py-1 rounded-full text-xs font-medium border border-[#ffe9d6] text-gray-500 hover:border-[#e8742a]/50 hover:text-[#e8742a] transition-colors"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={form.content}
                      onChange={(e) => {
                        if (e.target.value.length <= 500)
                          setForm((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }));
                      }}
                      placeholder="펫시터에게 전달하고 싶은 내용을 입력해주세요"
                      rows={7}
                      className="w-full px-4 py-3 bg-white border border-[#ffe9d6] rounded-xl text-[#281a0e] placeholder:text-gray-400 outline-none resize-none focus:border-[#e8742a] transition mt-1"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
                  <h3 className="text-base font-bold text-[#281a0e] mb-4 flex items-center gap-2">
                    펫시터 조건
                    <span className="px-2 py-0.5 bg-[#fff8f3] rounded-full text-xs font-medium text-[#e8742a]">
                      선택
                    </span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {SITTER_CONDITIONS.map((condition) => {
                      const isChecked = form.conditions.includes(condition);
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => toggleCondition(condition)}
                          className="flex items-center gap-3 text-left"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-[#e8742a] border-[#e8742a]"
                                : "border-gray-300"
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-[#281a0e] text-sm">
                            {condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 접힌 나머지 단계 (Anima 기준: bg-neutral-50, rounded-2xl, px-7 py-5) */}
            {STEPS.slice(step).map((label, i) => {
              const num = step + i + 1;
              return (
                <div
                  key={num}
                  className="flex items-center justify-between px-7 py-5 bg-neutral-50 rounded-2xl border border-[#ffe9d6]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-[#ffe9d6] flex items-center justify-center text-sm font-semibold text-gray-500">
                      {num}
                    </div>
                    <span className="text-[15px] font-medium text-gray-500">
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">작성 전</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 — sticky, 전체 폭 흰 바 (Anima 기준) */}
      <div className="sticky bottom-0 bg-white border-t border-[#ffe9d6] z-10">
        <div className="max-w-205 mx-auto flex items-center justify-between h-19 px-6">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            className="h-11 px-6 rounded-xl border border-[#ffe9d6] flex items-center gap-1.5 text-gray-500 text-[15px] font-medium hover:bg-[#fff8f3] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>

          <span className="text-sm text-gray-500">
            {step} / {STEPS.length}
          </span>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => canNext() && setStep((s) => s + 1)}
              className={`h-11 px-6 rounded-xl flex items-center gap-1.5 text-[15px] font-semibold transition-colors ${
                canNext()
                  ? "bg-[#e8742a] text-white hover:opacity-90"
                  : "bg-[#ffe9d6] text-gray-500 cursor-default"
              }`}
            >
              다음 단계
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext() || isSubmitting}
              className={`h-11 px-6 rounded-xl flex items-center gap-1.5 text-[15px] font-semibold bg-[#e8742a] text-white transition-opacity ${
                canNext() && !isSubmitting
                  ? "opacity-100 hover:opacity-90"
                  : "opacity-40"
              }`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "등록 중..." : "게시하기"}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
