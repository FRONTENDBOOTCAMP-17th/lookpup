"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import {
  ChevronLeft,
  Check,
  Home,
  // Heart,  // ← foster 비활성화로 미사용 (SERVICE_TYPES 주석 참고)
  PawPrint,
  Moon,
  Car,
  // MoreHorizontal,  // ← other 비활성화로 미사용 (SERVICE_TYPES 주석 참고)
  Send,
  MapPin,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RangePicker from "@/components/ui/RangePicker";
import SimpleTimePicker from "@/components/ui/SimpleTimePicker";
import { createClient } from "@/utils/supabase/client";
import { updateRequest } from "@/app/actions/requests";

const SERVICE_TYPES = [
  { label: "방문 돌봄", icon: Home, value: "care" },
  // ⚠️ "위탁 돌봄"(foster) / "기타"(other) 임시 비활성화 (2026-06-16)
  //
  // 이유: DB requests.request_type이 walk/care/hotel/pickup 4개만 허용할 가능성이 높음.
  //       (actions/requests.ts의 RequestInput.request_type 타입도 이 4개로 제한되어 있음)
  //       foster/other 선택 시 저장이 실패하므로, 활성화 전까지 버튼 자체를 노출하지 않음.
  //
  // ✅ 활성화하려면 (Supabase 권한이 있는 팀장에게 요청 필요):
  //   1) 실제 제약 확인 — Supabase SQL Editor에서:
  //        select conname, pg_get_constraintdef(oid)
  //        from pg_constraint
  //        where conrelid = 'requests'::regclass and contype = 'c';
  //      → 아무것도 안 나오면 제약 없음(바로 4번으로). request_type = ANY(...) 가 나오면 2번.
  //   2) 제약이 있으면 교체 (conname은 1번 결과값으로):
  //        alter table requests drop constraint requests_request_type_check;
  //        alter table requests add constraint requests_request_type_check
  //          check (request_type in ('walk','care','hotel','pickup','foster','other'));
  //   3) actions/requests.ts의 request_type 타입에 "foster" | "other" 추가
  //   4) 아래 두 줄(foster/other)과 상단 import의 Heart, MoreHorizontal 주석 해제
  //
  // { label: "위탁 돌봄", icon: Heart, value: "foster" },
  { label: "산책", icon: PawPrint, value: "walk" },
  { label: "펫 호텔", icon: Moon, value: "hotel" },
  { label: "픽업 서비스", icon: Car, value: "pickup" },
  // { label: "기타", icon: MoreHorizontal, value: "other" },
];

const BUDGET_PRESETS = [10000, 20000, 30000, 50000];

const ANIMAL_TYPE_MAP: Record<string, { label: string; emoji: string }> = {
  dog: { label: "강아지", emoji: "🐶" },
  cat: { label: "고양이", emoji: "🐱" },
  other: { label: "기타", emoji: "🐾" },
};

type Pet = {
  id: string;
  name: string;
  type: string;
  age: number | null;
  weight: number | null;
  emoji: string;
};

type FormState = {
  service_type: string;
  budget: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  start_time: string;
  end_time: string;
  location: string;
  selected_pets: string[];
  title: string;
  content: string;
};

export default function BoardEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<FormState>({
    service_type: "",
    budget: "",
    startDate: undefined,
    endDate: undefined,
    start_time: "",
    end_time: "",
    location: "",
    selected_pets: [],
    title: "",
    content: "",
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 기존 구인글 데이터 조회 (pre-fill용)
      const { data, error } = await supabase
        .from("requests")
        .select(`*, request_pets(pets(*))`)
        .eq("id", id)
        .single();

      if (!error && data) {
        // matched 상태면 수정 불가
        if (data.status === "matched") {
          setIsMatched(true);
          return;
        }
        const start = new Date(data.start_datetime);
        const end = new Date(data.end_datetime);
        setForm({
          service_type: data.request_type,
          budget: String(data.budget),
          startDate: start,
          endDate: end,
          start_time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
          end_time: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
          location: data.location,
          selected_pets: (
            data.request_pets as Array<{ pets: { id: string } | null }>
          )
            .map((rp) => rp.pets?.id)
            .filter((v): v is string => !!v),
          title: data.title,
          content: data.content ?? "",
        });
      }

      // 반려동물 목록 조회
      const { data: petData } = await supabase
        .from("pets")
        .select("id, name, animal_type, age, weight")
        .eq("owner_id", user.id)
        .is("deleted_at", null);

      if (petData && petData.length > 0) {
        setPets(
          petData.map((p) => ({
            id: p.id,
            name: p.name,
            type: ANIMAL_TYPE_MAP[p.animal_type]?.label ?? p.animal_type,
            age: p.age,
            weight: p.weight,
            emoji: ANIMAL_TYPE_MAP[p.animal_type]?.emoji ?? "🐾",
          })),
        );
      }
    }
    fetchData();
  }, [id]);

  const togglePet = (petId: string) =>
    setForm((prev) => ({
      ...prev,
      selected_pets: prev.selected_pets.includes(petId)
        ? prev.selected_pets.filter((p) => p !== petId)
        : [...prev.selected_pets, petId],
    }));

  const handleSubmit = async () => {
    if (!form.startDate) return;
    setIsSubmitting(true);

    const startDatetime = new Date(form.startDate);
    if (form.start_time) {
      const [h, m] = form.start_time.split(":").map(Number);
      startDatetime.setHours(h, m, 0, 0);
    }
    const endDatetime = form.endDate
      ? new Date(form.endDate)
      : new Date(form.startDate);
    if (form.end_time) {
      const [h, m] = form.end_time.split(":").map(Number);
      endDatetime.setHours(h, m, 0, 0);
    }

    const result = await updateRequest(id, {
      title: form.title,
      content: form.content,
      request_type: form.service_type as "walk" | "care" | "hotel" | "pickup",
      start_datetime: startDatetime.toISOString(),
      end_datetime: endDatetime.toISOString(),
      budget: form.budget ? parseInt(form.budget) : 0,
      location: form.location,
      pet_ids: form.selected_pets,
    });

    if (result.error) {
      alert(result.error.message);
      setIsSubmitting(false);
      return;
    }

    router.push(`/board/${id}`);
  };

  // matched 상태 — 수정 불가 화면
  if (isMatched) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#fff8f3] min-h-screen flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-4">
            <p className="text-stone-900 text-lg font-semibold">
              예약 완료된 게시글은 수정할 수 없습니다.
            </p>
            <button
              onClick={() => router.push(`/board/${id}`)}
              className="h-11 px-6 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              상세 페이지로 돌아가기
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const canSubmit =
    !!form.title.trim() && !!form.startDate && !!form.service_type;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fff8f3] min-h-screen pb-10">
        <div className="max-w-205 mx-auto px-4 sm:px-6 pt-10">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl border border-[#ffe9d6] flex items-center justify-center text-[#281a0e] hover:bg-[#fff8f3] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-[#281a0e]">
                돌봄 요청 수정
              </h1>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`h-10 px-5 rounded-xl text-[15px] font-semibold flex items-center gap-1.5 bg-[#e8742a] text-white transition-opacity ${
                canSubmit && !isSubmitting ? "opacity-100" : "opacity-40"
              }`}
            >
              <Send className="w-3.75 h-3.75" />
              {isSubmitting ? "저장 중..." : "저장하기"}
            </button>
          </div>

          <div className="flex flex-col gap-4 pt-8">
            {/* 서비스 유형 + 예산 */}
            <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
              <h2 className="text-lg font-semibold text-[#281a0e]">
                어떤 돌봄이 필요하신가요?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
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
                  <div className="w-full sm:w-80 h-12 flex items-center px-4 border border-[#ffe9d6] rounded-xl overflow-hidden">
                    <input
                      type="number"
                      value={form.budget}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, budget: e.target.value }))
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
                </div>
              </div>
            </div>

            {/* 날짜·시간 */}
            <div className="bg-white rounded-2xl border border-[#ffe9d6] p-4 sm:p-7">
              <h2 className="text-lg font-semibold text-[#281a0e]">
                날짜 · 시간
              </h2>
              <div className="mt-5 p-3 sm:p-5 bg-[#fff8f3] rounded-2xl border border-[#ffe9d6]">
                <RangePicker
                  value={
                    { from: form.startDate, to: form.endDate } as DateRange
                  }
                  onChange={(range) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: range?.from,
                      endDate: range?.to,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#281a0e]">
                    시작 시간
                  </span>
                  <SimpleTimePicker
                    value={form.start_time}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, start_time: value }))
                    }
                    placeholder="시작 시간 선택"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#281a0e]">
                    종료 시간
                  </span>
                  <SimpleTimePicker
                    value={form.end_time}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, end_time: value }))
                    }
                    placeholder="종료 시간 선택"
                  />
                </div>
              </div>
            </div>

            {/* 돌봄 장소 */}
            <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
              <h2 className="text-lg font-semibold text-[#281a0e]">
                돌봄 장소
              </h2>
              <div className="relative mt-4">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="주소 입력"
                  className="w-full h-12 pl-9 pr-4 bg-white border border-[#ffe9d6] rounded-xl text-[#281a0e] placeholder:text-gray-400 outline-none focus:border-[#e8742a] transition"
                />
              </div>
            </div>

            {/* 반려동물 선택 */}
            <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
              <h2 className="text-xl font-bold text-[#281a0e] mb-1">
                함께할 반려동물을 선택해주세요
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {pets.map((pet) => {
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
              </div>
            </div>

            {/* 제목 + 상세 내용 */}
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
                      setForm((prev) => ({ ...prev, title: e.target.value }));
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
