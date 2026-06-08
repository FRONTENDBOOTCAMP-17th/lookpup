"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, CreditCard, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { useBookingStore } from "@/store/bookingStore";
import Header from "@/components/layout/Header";
import RangePicker from "@/components/ui/RangePicker";

// 더미 데이터
const PETSITTER = { id: 1, name: "김민지", initial: "김", service: "방문돌봄", pricePerDay: 30000 };
const PLATFORM_FEE = 3000;
const PETS = [
  { id: 1, name: "뭉치", type: "강아지", breed: "포메라니안", age: 3, weight: 4 },
  { id: 2, name: "나비", type: "고양이", breed: "러시안블루", age: 2, weight: 3.5 },
];
const QUICK_NOTES = ["알러지 있음", "야간 돌봄 필요", "약 복용 중"];

//이거 나중에 api 박을거라 그냥 더미 넣어둠
const PAYMENT_METHODS = [
  { key: "card" as const, label: "신용/체크카드", emoji: "💳" },
  { key: "kakaopay" as const, label: "카카오페이", emoji: "💛" },
  { key: "tosspay" as const, label: "토스페이", emoji: "💙" },
];

// 날짜 포맷 헬퍼
function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

function calcNights(range: DateRange | undefined): number {
  if (!range?.from || !range?.to) return 1;
  const d = differenceInDays(range.to, range.from);
  return d > 0 ? d : 1;
}

// 공통 레이아웃
function StepCard({ children, step, title, total = 4 }: { children: React.ReactNode; step: number; title: string; total?: number }) {
  const router = useRouter();
  return (
    <div className="w-[800px] bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] flex flex-col overflow-hidden">
      <div className="h-14 px-8 bg-white border-b border-orange-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-orange-50 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <span className="text-stone-900 text-lg font-semibold">{title}</span>
        </div>
        <span className="text-gray-500 text-sm font-medium">{step}/{total}</span>
      </div>
      {children}
    </div>
  );
}

// 예약 요약 박스
function BookingSummary({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="p-5 bg-orange-50 rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100">
      <p className="text-stone-900 text-base font-semibold mb-3">예약 요약</p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{r.label}</span>
            <span className="text-stone-900 font-medium">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 다음 버튼
function NextButton({ label = "다음", onClick, disabled }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="h-24 px-8 bg-white border-t border-orange-100 flex items-center shrink-0">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-base font-semibold rounded-[10px] transition-colors"
      >
        {label}
      </button>
    </div>
  );
}

// Step 1: 날짜 선택
function StepDate({ onNext }: { onNext: () => void }) {
  const { dateRange, setDateRange } = useBookingStore();
  const nights = calcNights(dateRange);
  const total = PETSITTER.pricePerDay * nights;

  return (
    <StepCard step={1} title="날짜 선택">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {/* 달력 */}
        <div className="p-6 bg-orange-50 rounded-2xl">
          <RangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* 선택된 날짜 표시 */}
        {dateRange?.from && (
          <div className="p-4 bg-orange-500/10 rounded-xl flex items-center gap-2">
            <Calendar size={20} className="text-orange-500 shrink-0" />
            <span className="text-orange-500 text-base font-semibold">{formatDateRange(dateRange)}</span>
            {nights > 1 && (
              <span className="ml-auto text-orange-500 text-sm font-medium">{nights}일</span>
            )}
          </div>
        )}

        {/* 예약 요약 */}
        <BookingSummary rows={[
          { label: "펫시터", value: PETSITTER.name },
          { label: "서비스", value: PETSITTER.service },
          { label: "금액", value: `${total.toLocaleString()}원` },
        ]} />
      </div>
      <NextButton onClick={onNext} disabled={!dateRange?.from} />
    </StepCard>
  );
}

// Step 2: 반려동물 선택
function StepPet({ onNext }: { onNext: () => void }) {
  const { dateRange, petId, setPet } = useBookingStore();

  return (
    <StepCard step={2} title="반려동물 선택">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        <h2 className="text-stone-900 text-lg font-semibold">반려동물을 선택하세요</h2>

        <div className="flex flex-col gap-3">
          {PETS.map((pet) => {
            const selected = petId === pet.id;
            return (
              <button
                key={pet.id}
                onClick={() => setPet(pet.id, pet.name)}
                className={`w-full p-5 rounded-2xl border text-left flex items-center gap-4 transition-colors ${
                  selected ? "bg-orange-50 border-orange-500" : "bg-orange-50 border-orange-100 hover:border-orange-300"
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-stone-900 text-base font-semibold">{pet.name}</span>
                    <span className="px-3 py-1 bg-orange-50 border border-orange-100 text-orange-500 text-[10px] font-medium rounded-full">
                      {pet.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{pet.breed} · {pet.age}살 · {pet.weight}kg</p>
                </div>
                {selected && <Check size={20} className="text-orange-500 shrink-0" />}
              </button>
            );
          })}

          <button className="w-full h-14 rounded-2xl border border-orange-100 text-orange-500 text-base font-medium hover:bg-orange-50 transition-colors">
            + 반려동물 추가
          </button>
        </div>

        <BookingSummary rows={[
          { label: "날짜", value: formatDateRange(dateRange) },
          { label: "서비스", value: PETSITTER.service },
          { label: "반려동물", value: petId ? PETS.find((p) => p.id === petId)?.name ?? "-" : "-" },
        ]} />
      </div>
      <NextButton onClick={onNext} disabled={!petId} />
    </StepCard>
  );
}

// Step 3: 특이사항
function StepNote({ onNext }: { onNext: () => void }) {
  const { dateRange, petId, note, setNote } = useBookingStore();
  const MAX = 500;

  function appendQuickNote(quick: string) {
    const next = note ? `${note}\n${quick}` : quick;
    if (next.length <= MAX) setNote(next);
  }

  return (
    <StepCard step={3} title="특이사항">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        <h2 className="text-stone-900 text-lg font-semibold">특이사항을 입력해주세요</h2>

        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => e.target.value.length <= MAX && setNote(e.target.value)}
            placeholder={`펫시터에게 전달할 특이사항을 입력해주세요\n예) 낯선 사람 경계함, 약 복용 필요 등`}
            className="w-full h-44 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100 text-base text-stone-900 placeholder-stone-900/50 outline-none resize-none focus:border-orange-300 transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-gray-500 text-xs">{note.length}/{MAX}</span>
        </div>

        <div>
          <p className="text-stone-900 text-sm font-medium mb-3">자주 선택되는 특이사항</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_NOTES.map((q) => (
              <button
                key={q}
                onClick={() => appendQuickNote(q)}
                className="h-9 px-4 bg-orange-50 border border-orange-100 text-stone-900 text-xs font-medium rounded-full hover:border-orange-300 hover:bg-orange-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <BookingSummary rows={[
          { label: "날짜", value: formatDateRange(dateRange) },
          { label: "반려동물", value: petId ? PETS.find((p) => p.id === petId)?.name ?? "-" : "-" },
          { label: "서비스", value: PETSITTER.service },
        ]} />
      </div>
      <NextButton onClick={onNext} />
    </StepCard>
  );
}

// Step 4: 결제
function StepPayment({ onNext }: { onNext: () => void }) {
  const { dateRange, petId, paymentMethod, setPaymentMethod } = useBookingStore();
  const nights = calcNights(dateRange);
  const servicePrice = PETSITTER.pricePerDay * nights;
  const total = servicePrice + PLATFORM_FEE;
  const pet = PETS.find((p) => p.id === petId);

  async function handlePay() {
    if (!paymentMethod) return;
    // PortOne SDK 연동 예정: IMP.request_pay({ ... })
    onNext();
  }

  return (
    <StepCard step={4} title="결제하기">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {/* 주문 정보 */}
        <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-stone-900 text-base font-semibold mb-4">주문 정보</p>
          <div className="pb-4 border-b border-orange-100 flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-full border border-orange-100 flex items-center justify-center shrink-0">
              <span className="text-orange-500 text-base font-semibold">{PETSITTER.initial}</span>
            </div>
            <div>
              <p className="text-stone-900 text-base font-medium">{PETSITTER.name} 펫시터</p>
              <p className="text-gray-500 text-sm">{PETSITTER.service} · {formatDateRange(dateRange)}</p>
              {pet && <p className="text-gray-500 text-sm">{pet.name} ({pet.breed})</p>}
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">서비스 금액</span>
              <span className="text-stone-900">{servicePrice.toLocaleString()}원{nights > 1 ? ` (${nights}일)` : ""}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">플랫폼 수수료</span>
              <span className="text-stone-900">{PLATFORM_FEE.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-orange-100">
              <span className="text-stone-900 text-base font-bold">총 결제금액</span>
              <span className="text-orange-500 text-xl font-bold">{total.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 결제 수단 */}
        <div>
          <p className="text-stone-900 text-lg font-semibold mb-4">결제 수단</p>
          <div className="flex flex-col gap-3">
            {PAYMENT_METHODS.map((m) => {
              const selected = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`w-full p-5 rounded-xl border flex items-center gap-3 transition-colors ${
                    selected ? "border-orange-500 bg-orange-50" : "border-orange-100 bg-orange-50 hover:border-orange-300"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-stone-900 text-base font-medium">{m.label}</span>
                  {selected && <Check size={18} className="text-orange-500 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 환불 정책 */}
        <div className="p-4 bg-white rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-gray-400" />
            <p className="text-stone-900 text-base font-medium">환불 정책 확인</p>
          </div>
          <p className="text-gray-500 text-sm leading-6">
            예약 24시간 전까지 무료 취소 가능합니다. 24시간 이내 취소 시 50% 환불, 당일 취소 시 환불 불가합니다.
          </p>
        </div>
      </div>
      <NextButton label={`결제하기 ${total.toLocaleString()}원`} onClick={handlePay} disabled={!paymentMethod} />
    </StepCard>
  );
}

// Step 5: 예약 완료
function StepComplete() {
  const router = useRouter();
  const { dateRange, petId, reset } = useBookingStore();
  const nights = calcNights(dateRange);
  const total = PETSITTER.pricePerDay * nights + PLATFORM_FEE;
  const pet = PETS.find((p) => p.id === petId);

  function goHome() {
    reset();
    router.push("/");
  }

  function goChat() {
    reset();
    router.push(`/chat?roomId=${PETSITTER.id}`);
  }

  return (
    <div className="w-[800px] bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] overflow-hidden">
      <div className="px-8 py-12 flex flex-col items-center">
        {/* 완료 아이콘 */}
        <div className="w-24 h-24 bg-orange-500 rounded-full shadow-[0px_4px_20px_0px_rgba(232,116,42,0.30)] flex items-center justify-center mb-6">
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>

        <h1 className="text-stone-900 text-3xl font-bold mb-3">예약이 완료되었습니다!</h1>
        <p className="text-gray-500 text-base text-center leading-6 mb-10">
          펫시터에게 예약 알림이 전송되었습니다.<br />채팅으로 자세한 사항을 상담하세요.
        </p>

        {/* 예약 정보 카드 */}
        <div className="w-96 p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 mb-8">
          <p className="text-stone-900 text-base font-semibold mb-4">예약 정보</p>
          <div className="flex items-start gap-3 pb-3 border-b border-orange-100 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center shrink-0">
              <span className="text-orange-500 text-base font-semibold">{PETSITTER.initial}</span>
            </div>
            <div>
              <p className="text-stone-900 text-base font-medium">{PETSITTER.name} 펫시터</p>
              <p className="text-gray-500 text-sm">{PETSITTER.service}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">날짜</span>
              <span className="text-stone-900 font-medium">{formatDateRange(dateRange)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">반려동물</span>
              <span className="text-stone-900 font-medium">{pet?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">결제금액</span>
              <span className="text-orange-500 font-semibold">{total.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="w-96 flex flex-col gap-4">
          <button
            onClick={goChat}
            className="w-full h-12 bg-white border border-orange-500 text-orange-500 text-base font-semibold rounded-[10px] hover:bg-orange-50 transition-colors"
          >
            채팅으로 인사하기
          </button>
          <button
            onClick={goHome}
            className="w-full h-12 text-orange-500 text-base font-semibold hover:underline transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지
export default function BookPage() {
  const [step, setStep] = useState(1);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-orange-50 py-12 flex flex-col items-center">
        {step === 1 && <StepDate onNext={() => setStep(2)} />}
        {step === 2 && <StepPet onNext={() => setStep(3)} />}
        {step === 3 && <StepNote onNext={() => setStep(4)} />}
        {step === 4 && <StepPayment onNext={() => setStep(5)} />}
        {step === 5 && <StepComplete />}
      </main>
    </>
  );
}
