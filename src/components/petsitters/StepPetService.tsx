"use client";

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useBookingStore } from "@/store/bookingStore";
import BookingSummary from "./BookingSummary";
import type { Step2Values } from "@/schemas/booking.schema";
import type { Pet } from "@/hooks/queries/usePets";
import type { SitterBookingInfo, SitterService } from "@/hooks/queries/useSitterBookingInfo";

const SERVICES: { key: string; label: string; emoji: string; desc: string }[] = [
  { key: "visit", label: "방문돌봄", emoji: "🏠", desc: "보호자님 집에서 돌봄" },
  { key: "home", label: "위탁돌봄", emoji: "🏡", desc: "펫시터 집에서 돌봄" },
  { key: "walk", label: "산책", emoji: "🚶", desc: "반려동물 산책 서비스" },
  { key: "pickup", label: "픽업", emoji: "🚗", desc: "반려동물 픽업 서비스" },
];

const SERVICE_KEY_TO_TYPE: Record<string, string> = {
  visit: "방문돌봄",
  home: "위탁돌봄",
  walk: "산책",
  pickup: "픽업",
};

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

export default function StepPetService({
  pets,
  sitterServices,
  sitter,
}: {
  pets: Pet[];
  sitterServices: SitterService[];
  sitter: SitterBookingInfo;
}) {
  const router = useRouter();
  const { watch, setValue, formState: { errors } } = useFormContext<Step2Values>();
  const { dateRange, petIds, togglePet } = useBookingStore();

  const days = dateRange?.from && dateRange?.to
    ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1)
    : 1;
  const total = sitter.pricePerDay * days;

  function handleTogglePet(id: string, name: string) {
    togglePet(id, name);
    const next = petIds.includes(id)
      ? petIds.filter((p) => p !== id)
      : [...petIds, id];
    setValue("petIds", next, { shouldValidate: true });
  }
  const selectedService = watch("selectedService");

  const petNames = petIds
    .map((id) => pets.find((p) => p.id === id)?.name ?? "")
    .filter(Boolean)
    .join(", ") || "-";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">반려동물을 선택하세요</h2>
          <span className="text-xs text-gray-400">중복 선택 가능</span>
        </div>
        {errors.petIds && (
          <p className="mb-2 text-red-500 text-xs">{errors.petIds.message}</p>
        )}
        <div className="flex flex-col gap-3">
          {pets.map((pet) => {
            const selected = petIds.includes(pet.id);
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => handleTogglePet(pet.id, pet.name)}
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
                    <span className="text-stone-900 text-sm sm:text-base font-semibold">{pet.name}</span>
                    <span className="px-2 py-0.5 bg-white border border-orange-100 text-orange-500 text-[10px] font-medium rounded-full shrink-0">
                      {pet.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {pet.breed} · {pet.age}살 · {pet.weight}kg
                  </p>
                </div>
                {selected && <Check size={20} className="text-orange-500 shrink-0" />}
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

      <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-7">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">제공 서비스를 선택해주세요</h2>
        {errors.selectedService && (
          <p className="mb-2 text-red-500 text-xs">{errors.selectedService.message}</p>
        )}
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
                onClick={() => available && setValue("selectedService", svc.key)}
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
                  <p className="text-stone-900 text-sm font-semibold">{svc.label}</p>
                  <p className="text-gray-500 text-xs">{svc.desc}</p>
                </div>
                {selected && <Check size={18} className="text-orange-500 shrink-0" />}
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
          { label: "반려동물", value: petNames },
          { label: "금액", value: `${total.toLocaleString()}원` },
        ]}
      />
    </div>
  );
}
