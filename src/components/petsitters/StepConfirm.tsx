"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useBookingStore } from "@/store/bookingStore";
import type { SitterBookingInfo } from "@/hooks/queries/useSitterBookingInfo";
import type { Pet } from "@/hooks/queries/usePets";
import type { ServiceKey } from "./BookingClient";

const SERVICES: { key: string; label: string }[] = [
  { key: "visit", label: "방문돌봄" },
  { key: "home", label: "위탁돌봄" },
  { key: "walk", label: "산책" },
  { key: "pickup", label: "픽업" },
];

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "-";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "yyyy년 M월 d일 (EEE)", { locale: ko });
  }
  return `${format(range.from, "yyyy년 M월 d일", { locale: ko })} ~ ${format(range.to, "M월 d일 (EEE)", { locale: ko })}`;
}

export default function StepConfirm({
  sitter,
  pets,
  selectedService,
  chatRoomId,
}: {
  sitter: SitterBookingInfo;
  pets: Pet[];
  selectedService: ServiceKey | null;
  chatRoomId: string | null;
}) {
  const router = useRouter();
  const { dateRange, petIds, reset } = useBookingStore();

  const selectedPetNames = pets.filter((p) => petIds.includes(p.id)).map((p) => p.name);
  const serviceLabel = selectedService
    ? (SERVICES.find((s) => s.key === selectedService)?.label ?? "-")
    : "-";

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
        예약 요청이 전송되었습니다!
      </h1>
      <p className="text-gray-500 text-sm sm:text-base text-center leading-6 mb-8">
        펫시터가 요청을 확인 후 수락하면 예약이 확정됩니다.
        <br />
        채팅에서 진행 상황을 확인하세요.
      </p>

      <div className="w-full max-w-sm sm:max-w-[384px] bg-white rounded-2xl border border-orange-100 p-4 sm:p-5 mb-8">
        <p className="text-stone-900 text-base font-semibold mb-4">예약 정보</p>
        <div className="flex items-start gap-3 pb-3 border-b border-orange-100 mb-3">
          {sitter.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sitter.profileImage}
              alt={`${sitter.name} 프로필`}
              className="w-10 h-10 rounded-full border border-orange-100 object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center shrink-0">
              <span className="text-orange-500 text-base font-semibold">
                {sitter.initial}
              </span>
            </div>
          )}
          <div>
            <p className="text-stone-900 text-base font-medium">{sitter.name} 펫시터</p>
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
