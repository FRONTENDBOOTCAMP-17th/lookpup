"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useBookingStore } from "@/store/bookingStore";
import { findOrCreateRoom } from "@/app/actions/chat";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RangePicker from "@/components/ui/RangePicker";
import SimpleTimePicker from "@/components/ui/SimpleTimePicker";

//상수

const STEP_LABELS = [
  "날짜 선택",
  "반려동물·서비스",
  "특이사항",
  "완료",
];
const TOTAL_STEPS = 4;

const SITTER_SERVICE_LABEL: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

type Sitter = { id: string; name: string; initial: string; service: string; pricePerDay: number };
type SitterService = { id: string; service_type: string; price: number };
type SitterApiResponse = {
  id: string;
  full_name: string;
  base_price: number | null;
  request_type: string[];
  services: (SitterService & { is_active: boolean })[];
};
type Pet = { id: string; name: string; type: string; breed: string; age: number; weight: number; image_url: string | null };
type PetApiItem = { id: string; name: string; animal_type: string; breed: string | null; age: number; weight: number; image_url: string | null };

const SERVICE_KEY_TO_TYPE: Record<ServiceKey, string> = {
  visit: "방문돌봄",
  home: "위탁돌봄",
  walk: "산책",
  hotel: "호텔",
};

const QUICK_NOTES = ["알러지 있음", "야간 돌봄 필요", "약 복용 중"];

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

//시간 및 날짜 포맷터
function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

function formatTime12h(value: string): string {
  if (!value) return "--:--";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "오후" : "오전";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calcNights(range: DateRange | undefined): number {
  if (!range?.from || !range?.to) return 1;
  return Math.max(1, differenceInDays(range.to, range.from));
}

function petNamesFromIds(ids: string[], pets: Pet[]): string {
  if (ids.length === 0) return "-";
  return ids
    .map((id) => pets.find((p) => p.id === id)?.name ?? "")
    .filter(Boolean)
    .join(", ");
}

//공통 컴포넌트

function BookingSummary({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-orange-100">
      <p className="text-stone-900 text-base font-semibold mb-3">예약 요약</p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">{r.label}</span>
            <span className="text-stone-900 font-medium text-right">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

//Step 1: 날짜 선택

function StepDateContent({
  petsitter,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  bookedRanges,
}: {
  petsitter: Sitter;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  bookedRanges: { from: Date; to: Date }[];
}) {
  const { dateRange, setDateRange } = useBookingStore();
  const nights = calcNights(dateRange);
  const total = petsitter.pricePerDay * nights;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-5">
          날짜를 선택해주세요
        </h2>

        <div className="overflow-x-auto">
          <RangePicker value={dateRange} onChange={setDateRange} bookedRanges={bookedRanges} />
        </div>

        {dateRange?.from && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-orange-500 shrink-0" />
              <span className="text-orange-500 text-sm sm:text-base font-semibold">
                {formatDateRange(dateRange)}
              </span>
              {nights > 1 && (
                <span className="ml-auto text-orange-500 text-sm font-medium shrink-0">
                  {nights}일
                </span>
              )}
            </div>
            {(startTime || endTime) && (
              <div className="flex items-center gap-1.5 pl-6 text-sm text-gray-500">
                <span>시간</span>
                <span className="text-stone-900 font-medium">
                  {startTime ? formatTime12h(startTime) : "--:--"}
                </span>
                <span>~</span>
                <span className="text-stone-900 font-medium">
                  {endTime ? formatTime12h(endTime) : "--:--"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-900">
              시작 시간
            </label>
            <SimpleTimePicker value={startTime} onChange={setStartTime} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-900">
              종료 시간
            </label>
            <SimpleTimePicker value={endTime} onChange={setEndTime} />
          </div>
        </div>
      </div>

      <BookingSummary
        rows={[
          { label: "펫시터", value: petsitter.name },
          { label: "서비스", value: petsitter.service },
          { label: "금액", value: `${total.toLocaleString()}원` },
        ]}
      />
    </div>
  );
}

//Step 2: 반려동물 + 서비스 선택

function StepPetContent({
  pets,
  selectedService,
  setSelectedService,
  sitterServices,
}: {
  pets: Pet[];
  selectedService: ServiceKey | null;
  setSelectedService: (s: ServiceKey) => void;
  sitterServices: SitterService[];
}) {
  const router = useRouter();
  const { dateRange, petIds, togglePet } = useBookingStore();

  return (
    <div className="flex flex-col gap-4">
      {/* 반려동물 선택 */}
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">
            반려동물을 선택하세요
          </h2>
          <span className="text-xs text-gray-400">중복 선택 가능</span>
        </div>
        <div className="flex flex-col gap-3">
          {pets.map((pet) => {
            const selected = petIds.includes(pet.id);
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => togglePet(pet.id, pet.name)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-3 sm:gap-4 transition-colors ${
                  selected
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-orange-100 hover:border-orange-500/50"
                }`}
              >
                {pet.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.image_url} alt={pet.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-gray-100 to-gray-200 rounded-full shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-stone-900 text-sm sm:text-base font-semibold">
                      {pet.name}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-orange-100 text-orange-500 text-[10px] font-medium rounded-full shrink-0">
                      {pet.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {pet.breed} · {pet.age}살 · {pet.weight}kg
                  </p>
                </div>
                {selected && (
                  <Check size={20} className="text-orange-500 shrink-0" />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => router.push("/pet-register")}
            className="w-full min-h-11 h-14 rounded-2xl border-2 border-dashed border-orange-100 text-gray-400 text-sm font-medium hover:border-orange-500/50 hover:text-orange-500 transition-colors"
          >
            + 반려동물 추가
          </button>
        </div>
      </div>

      {/* 서비스 선택 */}
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          제공 서비스를 선택해주세요
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map((svc) => {
            const selected = selectedService === svc.key;
            const available = sitterServices.some(
              (s) => s.service_type === SERVICE_KEY_TO_TYPE[svc.key],
            );
            return (
              <button
                key={svc.key}
                type="button"
                onClick={() => available && setSelectedService(svc.key)}
                disabled={!available}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  !available
                    ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
                    : selected
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-orange-100 hover:border-orange-500/50"
                }`}
              >
                <span className="text-2xl shrink-0">{svc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm font-semibold">
                    {svc.label}
                  </p>
                  <p className="text-gray-500 text-xs">{svc.desc}</p>
                </div>
                {selected && (
                  <Check size={18} className="text-orange-500 shrink-0" />
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
          { label: "반려동물", value: petNamesFromIds(petIds, pets) },
        ]}
      />
    </div>
  );
}

//Step 3: 특이사항

function StepNoteContent({
  pets,
  selectedService,
}: {
  pets: Pet[];
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
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-5">
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
            className="w-full px-4 py-3 pb-8 bg-white border border-orange-100 rounded-xl text-stone-900 placeholder:text-gray-400 outline-none resize-none focus:border-orange-500 transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-gray-400 text-xs">
            {note.length}/{MAX}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-stone-900 text-sm font-medium mb-3">
            자주 선택되는 특이사항
          </p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_NOTES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => appendQuickNote(q)}
                className="min-h-9 px-4 py-1 border border-orange-100 text-gray-500 text-xs font-medium rounded-full hover:border-orange-500/50 hover:text-orange-500 transition-colors"
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
          { label: "반려동물", value: petNamesFromIds(petIds, pets) },
          { label: "서비스", value: serviceLabel },
        ]}
      />
    </div>
  );
}

// Step 4: 예약 완료

function StepCompleteContent({
  petsitter,
  pets,
  selectedService,
  chatRoomId,
}: {
  petsitter: Sitter;
  pets: Pet[];
  selectedService: ServiceKey | null;
  chatRoomId: string | null;
}) {
  const router = useRouter();
  const { dateRange, petIds, reset } = useBookingStore();
  const selectedPetNames = pets.filter((p) => petIds.includes(p.id)).map((p) => p.name);
  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ?? petsitter.service)
    : petsitter.service;

  function goHome() {
    reset();
    router.push("/");
  }

  function goChat() {
    reset();
    router.push(chatRoomId ? `/chat?roomId=${chatRoomId}` : "/chat");
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-500 rounded-full shadow-[0px_4px_20px_0px_rgba(232,116,42,0.30)] flex items-center justify-center mb-6">
        <Check size={36} className="text-white" strokeWidth={3} />
      </div>

      <h1 className="text-stone-900 text-2xl sm:text-3xl font-bold mb-3 text-center">
        예약이 완료되었습니다!
      </h1>
      <p className="text-gray-500 text-sm sm:text-base text-center leading-6 mb-8">
        펫시터에게 예약 알림이 전송되었습니다.
        <br />
        채팅으로 자세한 사항을 상담하세요.
      </p>

      <div className="w-full max-w-sm sm:max-w-[384px] bg-white rounded-2xl border border-orange-100 p-4 sm:p-5 mb-8">
        <p className="text-stone-900 text-base font-semibold mb-4">예약 정보</p>
        <div className="flex items-start gap-3 pb-3 border-b border-orange-100 mb-3">
          <div className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center shrink-0">
            <span className="text-orange-500 text-base font-semibold">
              {petsitter.initial}
            </span>
          </div>
          <div>
            <p className="text-stone-900 text-base font-medium">
              {petsitter.name} 펫시터
            </p>
            <p className="text-gray-500 text-sm">{serviceLabel}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">날짜</span>
            <span className="text-stone-900 font-medium text-right">
              {formatDateRange(dateRange)}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-2">
            <span className="text-gray-500 shrink-0">반려동물</span>
            <span className="text-stone-900 font-medium text-right">
              {selectedPetNames.length > 0 ? selectedPetNames.join(", ") : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm sm:max-w-[384px] flex flex-col gap-4">
        <button
          type="button"
          onClick={goChat}
          className="w-full min-h-11 h-12 bg-white border border-orange-500 text-orange-500 text-base font-semibold rounded-xl hover:bg-orange-50 transition-colors"
        >
          채팅으로 인사하기
        </button>
        <button
          type="button"
          onClick={goHome}
          className="w-full min-h-11 h-12 text-orange-500 text-base font-semibold hover:underline transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function BookPage() {
  const params = useParams();
  const sitterId = params.id as string;
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsitter, setPetsitter] = useState<Sitter>({ id: sitterId, name: "", initial: "", service: "", pricePerDay: 0 });
  const [sitterServices, setSitterServices] = useState<SitterService[]>([]);
  const [bookedRanges, setBookedRanges] = useState<{ from: Date; to: Date }[]>([]);
  const { dateRange, petIds, note } = useBookingStore();

  useEffect(() => {
    fetch(`/api/sitters/${sitterId}`)
      .then<{ data: SitterApiResponse }>((r) => r.json())
      .then(({ data }) => {
        const primary = data.services.find((s) => s.is_active) ?? data.services[0];
        setPetsitter({
          id: data.id,
          name: data.full_name ?? "",
          initial: (data.full_name ?? "?").charAt(0),
          service: primary ? (SITTER_SERVICE_LABEL[primary.service_type] ?? primary.service_type) : "",
          pricePerDay: data.base_price ?? primary?.price ?? 0,
        });
        setSitterServices(data.services.filter((s) => s.is_active).map(({ id, service_type, price }) => ({ id, service_type, price })));
      })
      .catch(() => {});
  }, [sitterId]);

  useEffect(() => {
    fetch(`/api/sitters/${sitterId}/availability`)
      .then<{ data: { from: string; to: string }[] }>((r) => r.json())
      .then(({ data }) =>
        setBookedRanges(
          data.map((r) => ({
            from: startOfDay(new Date(r.from)),
            to: startOfDay(new Date(r.to)),
          })),
        ),
      )
      .catch(() => {});
  }, [sitterId]);

  useEffect(() => {
    fetch("/api/pets")
      .then<{ data: PetApiItem[] }>((r) => r.json())
      .then(({ data }) =>
        setPets(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.animal_type === "dog" ? "강아지" : p.animal_type === "cat" ? "고양이" : p.animal_type,
            breed: p.breed ?? "",
            age: p.age,
            weight: p.weight,
            image_url: p.image_url,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const servicePrice = petsitter.pricePerDay * calcNights(dateRange);

  function canNext(): boolean {
    if (step === 1) return !!dateRange?.from && !(startTime && endTime && startTime >= endTime);
    if (step === 2) return petIds.length > 0 && !!selectedService;
    return true;
  }

  function buildISO(date: Date, time: string): string {
    const [h, m] = time ? time.split(":").map(Number) : [0, 0];
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function handleSubmit() {
    if (!canNext() || isSubmitting) return;

    const service =
      sitterServices.find((s) => s.service_type === SERVICE_KEY_TO_TYPE[selectedService ?? "visit"])
      ?? sitterServices[0];
    if (!service) return;

    setIsSubmitting(true);

    const startDt = buildISO(dateRange!.from!, startTime || "00:00");
    const endDt = buildISO(dateRange!.to ?? dateRange!.from!, endTime || "23:59");

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sitter_id: petsitter.id,
        service_id: service.id,
        pet_ids: petIds,
        start_datetime: startDt,
        end_datetime: endDt,
        memo: note || null,
      }),
    });

    setIsSubmitting(false);
    if (!res.ok) return;

    setStep(4);
    findOrCreateRoom({ sitter_id: petsitter.id, room_type: "direct" })
      .then((result) => { if (result.data) setChatRoomId(result.data.room_id); })
      .catch(() => {});
  }

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen pb-28">
        <div className="max-w-205 mx-auto px-4 sm:px-6 pt-10">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  step > 1 ? setStep((s) => s - 1) : router.back()
                }
                className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center text-stone-900 hover:bg-orange-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-stone-900">
                {step === 4 ? "예약 완료" : "펫시터 예약"}
              </h1>
            </div>
            {step < 4 && (
              <span className="text-sm text-gray-500">
                {step} / {TOTAL_STEPS}
              </span>
            )}
          </div>

          {/* 스텝 인디케이터 */}
          {step < 4 && (
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
                            ? "bg-orange-500 text-white"
                            : "border-2 border-orange-100 text-gray-500"
                        }`}
                      >
                        {isDone ? <Check className="size-3.5" /> : num}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs text-center leading-tight ${
                          isActive
                            ? "font-bold text-stone-900"
                            : "font-normal text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-px mt-4 mx-2 ${isDone ? "bg-orange-500" : "bg-orange-100"}`}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}

          {/* 단계별 콘텐츠 */}
          <div className="pt-8">
            {step === 1 && <StepDateContent petsitter={petsitter} startTime={startTime} setStartTime={setStartTime} endTime={endTime} setEndTime={setEndTime} bookedRanges={bookedRanges} />}
            {step === 2 && (
              <StepPetContent
                pets={pets}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                sitterServices={sitterServices}
              />
            )}
            {step === 3 && (
              <StepNoteContent pets={pets} selectedService={selectedService} />
            )}
            {step === 4 && (
              <StepCompleteContent petsitter={petsitter} pets={pets} selectedService={selectedService} chatRoomId={chatRoomId} />
            )}
          </div>
        </div>
      </main>

      {/* 하단 sticky 네비게이션 */}
      {step < 4 && (
        <div className="sticky bottom-0 bg-white border-t border-orange-100 z-10">
          <div className="max-w-205 mx-auto flex items-center justify-between h-19 px-6">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
              className="h-11 px-6 rounded-xl border border-orange-100 flex items-center gap-1.5 text-gray-500 text-[15px] font-medium hover:bg-orange-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>

            <span className="text-sm text-gray-500">
              {step} / {TOTAL_STEPS}
            </span>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => canNext() && setStep((s) => s + 1)}
                className={`h-11 px-6 rounded-xl flex items-center gap-1.5 text-[15px] font-semibold transition-colors ${
                  canNext()
                    ? "bg-orange-500 text-white hover:opacity-90"
                    : "bg-orange-100 text-gray-500 cursor-default"
                }`}
              >
                다음 단계
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl bg-orange-500 text-white text-[15px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? "예약 중..." : "예약하기"}
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />

    </>
  );
}
