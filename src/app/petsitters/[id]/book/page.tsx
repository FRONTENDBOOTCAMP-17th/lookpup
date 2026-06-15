"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  Calendar,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { useBookingStore } from "@/store/bookingStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RangePicker from "@/components/ui/RangePicker";
import SimpleTimePicker from "@/components/ui/SimpleTimePicker";
import { CustomModal } from "@/components/common/CustomModal";
import { PaymentModalContent } from "@/components/common/PaymentModalContent";

const STEP_LABELS = [
  "날짜 선택",
  "반려동물·서비스",
  "특이사항",
  "결제",
  "완료",
];
const TOTAL_STEPS = 5;

const PETSITTER = {
  id: 1,
  name: "김민지",
  initial: "김",
  service: "방문돌봄",
  pricePerDay: 30000,
};
const PLATFORM_FEE = 3000;
const PETS = [
  {
    id: 1,
    name: "뭉치",
    type: "강아지",
    breed: "포메라니안",
    age: 3,
    weight: 4,
  },
  {
    id: 2,
    name: "나비",
    type: "고양이",
    breed: "러시안블루",
    age: 2,
    weight: 3.5,
  },
];
const QUICK_NOTES = ["알러지 있음", "야간 돌봄 필요", "약 복용 중"];

type PaymentMethodKey = "card" | "kakaopay" | "tosspay";
const PAYMENT_METHODS: {
  key: PaymentMethodKey;
  label: string;
  emoji: string;
}[] = [
  { key: "card", label: "신용/체크카드", emoji: "💳" },
  { key: "kakaopay", label: "카카오페이", emoji: "💛" },
  { key: "tosspay", label: "토스페이", emoji: "💙" },
];

type ServiceKey = "visit" | "home" | "walk" | "hotel";
const SERVICES: {
  key: ServiceKey;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    key: "visit",
    label: "방문돌봄",
    emoji: "🏠",
    desc: "보호자님 집에서 돌봄",
  },
  { key: "home", label: "위탁돌봄", emoji: "🏡", desc: "펫시터 집에서 돌봄" },
  { key: "walk", label: "산책", emoji: "🚶", desc: "반려동물 산책 서비스" },
  { key: "hotel", label: "펫호텔", emoji: "🏨", desc: "장기 위탁 돌봄" },
];

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

/** HH:mm → "오전 02:30" 형태 출력 추가함 */
function formatTime12h(value: string): string {
  if (!value) return "--:--";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "오후" : "오전";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calcNights(range: DateRange | undefined): number {
  if (!range?.from || !range?.to) return 1;
  const d = differenceInDays(range.to, range.from);
  return d > 0 ? d : 1;
}

// 예약 요약 박스
function BookingSummary({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#ffe9d6]">
      <p className="text-[#281a0e] text-base font-semibold mb-3">예약 요약</p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">{r.label}</span>
            <span className="text-[#281a0e] font-medium text-right">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 1: 날짜 선택 콘텐츠
function StepDateContent() {
  const { dateRange, setDateRange } = useBookingStore();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const nights = calcNights(dateRange);
  const total = PETSITTER.pricePerDay * nights;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-[#281a0e] mb-5">
          날짜를 선택해주세요
        </h2>

        {/* 달력 */}
        <div className="p-3 sm:p-5 bg-[#fff8f3] rounded-2xl border border-[#ffe9d6] overflow-x-auto">
          <RangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* 선택된 날짜 + 시간 요약 표시 */}
        {dateRange?.from && (
          <div className="mt-4 p-4 bg-[#fff8f3] rounded-xl border border-[#ffe9d6] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#e8742a] shrink-0" />
              <span className="text-[#e8742a] text-sm sm:text-base font-semibold">
                {formatDateRange(dateRange)}
              </span>
              {nights > 1 && (
                <span className="ml-auto text-[#e8742a] text-sm font-medium shrink-0">
                  {nights}일
                </span>
              )}
            </div>
            {(startTime || endTime) && (
              <div className="flex items-center gap-1.5 pl-6 text-sm text-gray-500">
                <span>시간</span>
                <span className="text-[#281a0e] font-medium">
                  {startTime ? formatTime12h(startTime) : "--:--"}
                </span>
                <span>~</span>
                <span className="text-[#281a0e] font-medium">
                  {endTime ? formatTime12h(endTime) : "--:--"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 시간 입력 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#281a0e]">
              시작 시간
            </label>
            <SimpleTimePicker
              value={startTime}
              onChange={setStartTime}
              placeholder="시작 시간 선택"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#281a0e]">
              종료 시간
            </label>
            <SimpleTimePicker
              value={endTime}
              onChange={setEndTime}
              placeholder="종료 시간 선택"
            />
          </div>
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "펫시터", value: PETSITTER.name },
          { label: "서비스", value: PETSITTER.service },
          { label: "금액", value: `${total.toLocaleString()}원` },
        ]}
      />
    </div>
  );
}

// Step 2: 반려동물 + 서비스 선택 콘텐츠
function StepPetContent({
  selectedService,
  setSelectedService,
}: {
  selectedService: ServiceKey | null;
  setSelectedService: (s: ServiceKey) => void;
}) {
  const router = useRouter();
  const { dateRange, petIds, togglePet } = useBookingStore();

  return (
    <div className="flex flex-col gap-4">
      {/* 반려동물 선택 */}
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#281a0e]">
            반려동물을 선택하세요
          </h2>
          <span className="text-xs text-gray-400">중복 선택 가능</span>
        </div>
        <div className="flex flex-col gap-3">
          {PETS.map((pet) => {
            const selected = petIds.includes(pet.id);
            return (
              <button
                key={pet.id}
                onClick={() => togglePet(pet.id, pet.name)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-3 sm:gap-4 transition-colors ${
                  selected
                    ? "bg-[#fff8f3] border-[#e8742a]"
                    : "bg-white border-[#ffe9d6] hover:border-[#e8742a]/50"
                }`}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#281a0e] text-sm sm:text-base font-semibold">
                      {pet.name}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#ffe9d6] text-[#e8742a] text-[10px] font-medium rounded-full shrink-0">
                      {pet.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {pet.breed} · {pet.age}살 · {pet.weight}kg
                  </p>
                </div>
                {selected && (
                  <Check size={20} className="text-[#e8742a] shrink-0" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => router.push("/pet-register")}
            className="w-full min-h-[44px] h-14 rounded-2xl border-2 border-dashed border-[#ffe9d6] text-gray-400 text-sm font-medium hover:border-[#e8742a]/50 hover:text-[#e8742a] transition-colors"
          >
            + 반려동물 추가
          </button>
        </div>
      </div>

      {/* 서비스 선택 */}
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-[#281a0e] mb-4">
          제공 서비스를 선택해주세요
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map((svc) => {
            const selected = selectedService === svc.key;
            return (
              <button
                key={svc.key}
                onClick={() => setSelectedService(svc.key)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  selected
                    ? "bg-[#fff8f3] border-[#e8742a]"
                    : "bg-white border-[#ffe9d6] hover:border-[#e8742a]/50"
                }`}
              >
                <span className="text-2xl shrink-0">{svc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#281a0e] text-sm font-semibold">
                    {svc.label}
                  </p>
                  <p className="text-gray-500 text-xs">{svc.desc}</p>
                </div>
                {selected && (
                  <Check size={18} className="text-[#e8742a] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "날짜", value: formatDateRange(dateRange) },
          {
            label: "서비스",
            value: selectedService
              ? (SERVICES.find((s) => s.key === selectedService)?.label ?? "-")
              : "-",
          },
          {
            label: "반려동물",
            value: petIds.length > 0
              ? petIds.map((id) => PETS.find((p) => p.id === id)?.name ?? "").filter(Boolean).join(", ")
              : "-",
          },
        ]}
      />
    </div>
  );
}

// Step 3: 특이사항 콘텐츠
function StepNoteContent({
  selectedService,
}: {
  selectedService: ServiceKey | null;
}) {
  const { dateRange, petIds, note, setNote } = useBookingStore();
  const MAX = 500;

  function appendQuickNote(quick: string) {
    const next = note ? `${note}\n${quick}` : quick;
    if (next.length <= MAX) setNote(next);
  }

  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ?? "-")
    : "-";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-[#281a0e] mb-5">
          특이사항을 입력해주세요
        </h2>

        <div className="relative">
          <textarea
            value={note}
            onChange={(e) =>
              e.target.value.length <= MAX && setNote(e.target.value)
            }
            placeholder={`펫시터에게 전달할 특이사항을 입력해주세요\n예) 낯선 사람 경계함, 약 복용 필요 등`}
            rows={7}
            className="w-full px-4 py-3 pb-8 bg-white border border-[#ffe9d6] rounded-xl text-[#281a0e] placeholder:text-gray-400 outline-none resize-none focus:border-[#e8742a] transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-gray-400 text-xs">
            {note.length}/{MAX}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[#281a0e] text-sm font-medium mb-3">
            자주 선택되는 특이사항
          </p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_NOTES.map((q) => (
              <button
                key={q}
                onClick={() => appendQuickNote(q)}
                className="min-h-[36px] px-4 py-1 border border-[#ffe9d6] text-gray-500 text-xs font-medium rounded-full hover:border-[#e8742a]/50 hover:text-[#e8742a] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "날짜", value: formatDateRange(dateRange) },
          {
            label: "반려동물",
            value: petIds.length > 0
              ? petIds.map((id) => PETS.find((p) => p.id === id)?.name ?? "").filter(Boolean).join(", ")
              : "-",
          },
          { label: "서비스", value: serviceLabel },
        ]}
      />
    </div>
  );
}

// Step 4: 결제 콘텐츠
function StepPaymentContent({
  selectedService,
}: {
  selectedService: ServiceKey | null;
}) {
  const { dateRange, petIds, paymentMethod, setPaymentMethod } =
    useBookingStore();
  const nights = calcNights(dateRange);
  const servicePrice = PETSITTER.pricePerDay * nights;
  const selectedPets = PETS.filter((p) => petIds.includes(p.id));
  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ??
      PETSITTER.service)
    : PETSITTER.service;

  return (
    <div className="flex flex-col gap-4">
      {/* 주문 정보 */}
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
        <p className="text-[#281a0e] text-lg font-semibold mb-5">주문 정보</p>
        <div className="pb-4 border-b border-[#ffe9d6] flex items-start gap-3">
          <div className="w-10 h-10 bg-[#fff8f3] rounded-full border border-[#ffe9d6] flex items-center justify-center shrink-0">
            <span className="text-[#e8742a] text-base font-semibold">
              {PETSITTER.initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[#281a0e] text-base font-medium">
              {PETSITTER.name} 펫시터
            </p>
            <p className="text-gray-500 text-sm">
              {serviceLabel} · {formatDateRange(dateRange)}
            </p>
            {selectedPets.length > 0 && (
              <p className="text-gray-500 text-sm">
                {selectedPets.map((p) => `${p.name} (${p.breed})`).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">서비스 금액</span>
            <span className="text-[#281a0e]">
              {servicePrice.toLocaleString()}원
              {nights > 1 ? ` (${nights}일)` : ""}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">플랫폼 수수료</span>
            <span className="text-[#281a0e]">
              {PLATFORM_FEE.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[#ffe9d6]">
            <span className="text-[#281a0e] text-base font-bold">
              총 결제금액
            </span>
            <span className="text-[#e8742a] text-xl font-bold">
              {(servicePrice + PLATFORM_FEE).toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 환불 정책 */}
      <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={16} className="text-gray-400" />
          <p className="text-[#281a0e] text-base font-medium">환불 정책 확인</p>
        </div>
        <p className="text-gray-500 text-sm leading-6">
          예약 24시간 전까지 무료 취소 가능합니다. 24시간 이내 취소 시 50% 환불,
          당일 취소 시 환불 불가합니다.
        </p>
      </div>
    </div>
  );
}

// Step 5: 예약 완료
function StepCompleteContent({
  selectedService,
}: {
  selectedService: ServiceKey | null;
}) {
  const router = useRouter();
  const { dateRange, petIds, reset } = useBookingStore();
  const nights = calcNights(dateRange);
  const total = PETSITTER.pricePerDay * nights + PLATFORM_FEE;
  const selectedPetNames = PETS.filter((p) => petIds.includes(p.id)).map((p) => p.name);
  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ??
      PETSITTER.service)
    : PETSITTER.service;

  function goHome() {
    reset();
    router.push("/");
  }

  function goChat() {
    reset();
    router.push(`/chat?roomId=${PETSITTER.id}`);
  }

  return (
    <div className="flex flex-col items-center py-8">
      {/* 완료 아이콘 */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#e8742a] rounded-full shadow-[0px_4px_20px_0px_rgba(232,116,42,0.30)] flex items-center justify-center mb-6">
        <Check size={36} className="text-white" strokeWidth={3} />
      </div>

      <h1 className="text-[#281a0e] text-2xl sm:text-3xl font-bold mb-3 text-center">
        예약이 완료되었습니다!
      </h1>
      <p className="text-gray-500 text-sm sm:text-base text-center leading-6 mb-8">
        펫시터에게 예약 알림이 전송되었습니다.
        <br />
        채팅으로 자세한 사항을 상담하세요.
      </p>

      {/* 예약 정보 카드 */}
      <div className="w-full max-w-sm sm:max-w-[384px] bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-5 mb-8">
        <p className="text-[#281a0e] text-base font-semibold mb-4">예약 정보</p>
        <div className="flex items-start gap-3 pb-3 border-b border-[#ffe9d6] mb-3">
          <div className="w-10 h-10 bg-[#fff8f3] rounded-full border border-[#ffe9d6] flex items-center justify-center shrink-0">
            <span className="text-[#e8742a] text-base font-semibold">
              {PETSITTER.initial}
            </span>
          </div>
          <div>
            <p className="text-[#281a0e] text-base font-medium">
              {PETSITTER.name} 펫시터
            </p>
            <p className="text-gray-500 text-sm">{serviceLabel}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">날짜</span>
            <span className="text-[#281a0e] font-medium text-right">
              {formatDateRange(dateRange)}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">반려동물</span>
            <span className="text-[#281a0e] font-medium text-right">
              {selectedPetNames.length > 0 ? selectedPetNames.join(", ") : "-"}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">결제금액</span>
            <span className="text-[#e8742a] font-semibold">
              {total.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="w-full max-w-sm sm:max-w-[384px] flex flex-col gap-4">
        <button
          onClick={goChat}
          className="w-full min-h-[44px] h-12 bg-white border border-[#e8742a] text-[#e8742a] text-base font-semibold rounded-xl hover:bg-[#fff8f3] transition-colors"
        >
          채팅으로 인사하기
        </button>
        <button
          onClick={goHome}
          className="w-full min-h-[44px] h-12 text-[#e8742a] text-base font-semibold hover:underline transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

// 메인 페이지
export default function BookPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceKey | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { dateRange, petIds, paymentMethod } = useBookingStore();
  const router = useRouter();

  const nights = calcNights(dateRange);
  const servicePrice = PETSITTER.pricePerDay * nights;
  const total = servicePrice + PLATFORM_FEE;

  function canNext(): boolean {
    if (step === 1) return !!dateRange?.from;
    if (step === 2) return petIds.length > 0 && !!selectedService;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  }

  function handleNext() {
    if (step === 4) {
      setShowPaymentModal(true);
    } else if (canNext()) {
      setStep((s) => s + 1);
    }
  }

  function handlePayConfirm() {
    setShowPaymentModal(false);
    setStep(5);
  }

  return (
    <>
      <Header />

      <main className="flex-1 bg-[#fff8f3] min-h-screen pb-28">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 pt-10">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  step > 1 ? setStep((s) => s - 1) : router.back()
                }
                className="w-10 h-10 rounded-xl border border-[#ffe9d6] flex items-center justify-center text-[#281a0e] hover:bg-[#fff8f3] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-[#281a0e]">
                {step === 5 ? "예약 완료" : "펫시터 예약"}
              </h1>
            </div>
            {step < 5 && (
              <span className="text-sm text-gray-500">
                {step} / {TOTAL_STEPS}
              </span>
            )}
          </div>

          {/* 스텝 인디케이터 */}
          {step < 5 && (
            <div className="flex items-start w-full pt-8">
              {STEP_LABELS.map((label, i) => {
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
                        className={`text-[10px] sm:text-xs text-center leading-tight ${
                          isActive
                            ? "font-bold text-[#281a0e]"
                            : "font-normal text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-px mt-4 mx-2 ${
                          isDone ? "bg-[#e8742a]" : "bg-[#ffe9d6]"
                        }`}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}

          {/* 단계별 콘텐츠 */}
          <div className="pt-8">
            {step === 1 && <StepDateContent />}
            {step === 2 && (
              <StepPetContent
                selectedService={selectedService}
                setSelectedService={setSelectedService}
              />
            )}
            {step === 3 && (
              <StepNoteContent selectedService={selectedService} />
            )}
            {step === 4 && (
              <StepPaymentContent selectedService={selectedService} />
            )}
            {step === 5 && (
              <StepCompleteContent selectedService={selectedService} />
            )}
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      {step < 5 && (
        <div className="sticky bottom-0 bg-white border-t border-[#ffe9d6] z-10">
          <div className="max-w-[820px] mx-auto flex items-center justify-between h-19 px-6">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
              className="h-11 px-6 rounded-xl border border-[#ffe9d6] flex items-center gap-1.5 text-gray-500 text-[15px] font-medium hover:bg-[#fff8f3] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>

            <span className="text-sm text-gray-500">
              {step} / {TOTAL_STEPS}
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
                onClick={handleNext}
                disabled={!canNext()}
                className={`h-11 px-6 rounded-xl text-[15px] font-semibold transition-colors ${
                  canNext()
                    ? "bg-[#e8742a] text-white hover:opacity-90"
                    : "bg-[#ffe9d6] text-gray-500 cursor-default"
                }`}
              >
                결제하기 {total.toLocaleString()}원
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />

      <CustomModal
        open={showPaymentModal}
        preset="payment"
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayConfirm}
      >
        <PaymentModalContent
          amount={servicePrice}
          feeRate={PLATFORM_FEE / servicePrice}
        />
      </CustomModal>
    </>
  );
}
