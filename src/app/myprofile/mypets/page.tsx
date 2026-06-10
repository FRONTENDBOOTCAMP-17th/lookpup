"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  PawPrint,
  AlertTriangle,
  CheckCircle2,
  X,
  Camera,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";

// 더미데이터

interface Pet {
  id: string;
  name: string;
  animal_type: "dog" | "cat" | "other";
  breed: string;
  age: number;
  weight: number;
  gender: "수컷" | "암컷";
  caution: string;
  emoji: string;
  bgFrom: string;
  bgTo: string;
}

const ANIMAL_TYPE_LABEL: Record<"dog" | "cat" | "other", string> = {
  dog: "강아지",
  cat: "고양이",
  other: "기타",
};

const INITIAL_PETS: Pet[] = [
  {
    id: "p1",
    name: "몽이",
    animal_type: "dog",
    breed: "골든 리트리버",
    age: 2,
    weight: 15.2,
    gender: "수컷",
    caution: "사람을 좋아하고 활발해요!",
    emoji: "🐕",
    bgFrom: "#FDE8C4",
    bgTo: "#FAD7A0",
  },
  {
    id: "p2",
    name: "나비",
    animal_type: "cat",
    breed: "코리안 숏헤어",
    age: 5,
    weight: 3.8,
    gender: "암컷",
    caution: "조용하고 독립적이에요.",
    emoji: "🐱",
    bgFrom: "#D6EAF8",
    bgTo: "#AED6F1",
  },
  {
    id: "p3",
    name: "코코",
    animal_type: "dog",
    breed: "말티즈",
    age: 4,
    weight: 3.2,
    gender: "수컷",
    caution: "분리불안이 있어요. 주의해주세요.",
    emoji: "🐶",
    bgFrom: "#D5F5E3",
    bgTo: "#A9DFBF",
  },
];

// 컴포넌트

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${enabled ? "bg-[#E8742A]" : "bg-[#D1D5DB]"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function DeleteModal({
  pet,
  onClose,
  onConfirm,
}: {
  pet: Pet;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-115 max-w-full p-8 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-[#E8742A]" />
          </div>
          <h3 className="text-xl font-bold text-[#281A0E] mb-2">
            등록된 정보를 삭제하시겠어요?
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            삭제된 정보는 복구할 수 없습니다.
          </p>

          {/* 반려동물 미리보기 */}
          <div className="w-full flex items-center gap-3 p-4 bg-[#FFF8F3] rounded-xl mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${pet.bgFrom}, ${pet.bgTo})`,
              }}
            >
              {pet.emoji}
            </div>
            <div className="text-left">
              <p className="font-semibold text-[#281A0E]">{pet.name}</p>
              <p className="text-sm text-[#6B7280]">{pet.breed}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function SuccessModal({
  pet,
  onView,
  onClose,
}: {
  pet: Pet;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-120 max-w-full p-8 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-[#E8742A]" />
          </div>
          <h3 className="text-xl font-bold text-[#281A0E] mb-2">
            등록이 완료되었어요
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            이제 돌봄 요청 시 선택할 수 있습니다.
          </p>

          <div className="w-full flex items-center gap-3 p-4 bg-[#FFF8F3] rounded-xl mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${pet.bgFrom}, ${pet.bgTo})`,
              }}
            >
              {pet.emoji}
            </div>
            <div className="text-left">
              <p className="font-semibold text-[#281A0E]">{pet.name}</p>
              <p className="text-sm text-[#6B7280]">{pet.breed}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 transition-colors"
            >
              확인
            </button>
            <button
              onClick={onView}
              className="flex-1 h-12 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
            >
              내 반려동물 보기
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function GuideModal({
  onRegister,
  onLater,
}: {
  onRegister: () => void;
  onLater: () => void;
}) {
  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-130 max-w-full p-8 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-6 relative">
            <PawPrint size={42} className="text-[#E8742A]" />
            <div className="absolute -bottom-2 -right-2 text-3xl">🐾</div>
          </div>
          <h3 className="text-xl font-bold text-[#281A0E] mb-2">
            먼저 반려동물을 등록해주세요
          </h3>
          <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
            돌봄 요청과 예약을 위해
            <br />
            반려동물 정보가 필요합니다.
          </p>
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={onRegister}
              className="w-full h-12 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
            >
              반려동물 등록하기
            </button>
            <button
              onClick={onLater}
              className="w-full h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 transition-colors"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function SelectionModal({
  pets,
  onClose,
}: {
  pets: Pet[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-225 max-w-full shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 pt-8 pb-5 border-b border-[#FFE9D6] flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#281A0E]">반려동물 선택</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">
              함께 돌봄을 받을 반려동물을 선택해주세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#FFF8F3] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* 그리드 */}
        <div className="p-6 grid grid-cols-3 sm:grid-cols-3 gap-4">
          {pets.map((pet) => {
            const isSelected = selected.includes(pet.id);
            return (
              <button
                key={pet.id}
                onClick={() => toggle(pet.id)}
                className={`relative flex flex-col overflow-hidden rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[#E8742A] shadow-[0_0_0_3px_rgba(232,116,42,0.15)]"
                    : "border-[#FFE9D6] hover:border-[#E8742A]/40"
                }`}
              >
                <div
                  className="h-30 w-full flex items-center justify-center text-4xl"
                  style={{
                    background: `linear-gradient(135deg, ${pet.bgFrom}, ${pet.bgTo})`,
                  }}
                >
                  {pet.emoji}
                  <div className="absolute top-2 left-2 bg-[#FFF8F3]/90 px-2.5 py-0.5 rounded-full border border-[#FFE9D6]">
                    <span className="text-[11px] font-semibold text-[#E8742A]">
                      {ANIMAL_TYPE_LABEL[pet.animal_type]}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#E8742A] rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="bg-white py-3 px-3 text-center">
                  <p className="text-sm font-semibold text-[#281A0E]">
                    {pet.name}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{pet.breed}</p>
                  <p className="text-xs text-[#6B7280]">{pet.age}살</p>
                </div>
              </button>
            );
          })}

          {/* 반려동물 추가 카드 */}
          <button className="flex flex-col items-center justify-center gap-2 h-50 rounded-xl border-2 border-dashed border-[#FFE9D6] hover:border-[#E8742A]/60 hover:bg-[#FFFAF7] transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#FFF8F3] flex items-center justify-center group-hover:bg-[#FFF0E8] transition-colors">
              <Plus size={20} className="text-[#E8742A]" />
            </div>
            <span className="text-sm font-medium text-[#6B7280]">
              새 반려동물 등록
            </span>
          </button>
        </div>

        {/* 푸터 */}
        <div className="px-8 pb-8 pt-4 border-t border-[#FFE9D6] flex items-center justify-between">
          <span className="text-sm font-medium text-[#6B7280]">
            {selected.length > 0 && `${selected.length}마리 선택됨`}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelected([])}
              className="h-11 px-6 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 transition-colors"
            >
              선택 취소
            </button>
            <button
              onClick={onClose}
              disabled={selected.length === 0}
              className="h-11 px-6 rounded-xl bg-[#E8742A] text-white font-semibold disabled:bg-[#FFE9D6] disabled:text-[#6B7280] hover:bg-[#D4621A] transition-colors"
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function EditModal({
  pet,
  onClose,
  onSave,
}: {
  pet: Pet;
  onClose: () => void;
  onSave: (updated: Pet) => void;
}) {
  const [form, setForm] = useState({ ...pet });
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof Pet>(k: K, v: Pet[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-180 max-w-full shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-8 pt-7 pb-5 border-b border-[#FFE9D6] flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-[#281A0E]">
            반려동물 정보 수정
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#FFF8F3] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
          />

          {/* 사진 */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div
                className="w-25 h-25 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background: `linear-gradient(135deg, ${form.bgFrom}, ${form.bgTo})`,
                }}
              >
                {form.emoji}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#E8742A] rounded-full flex items-center justify-center shadow"
              >
                <Camera size={15} className="text-white" />
              </button>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-sm text-[#E8742A] font-medium hover:underline"
            >
              사진 변경
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {/* 이름 */}
            <FormField label="이름">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full h-11 px-4 border border-[#FFE9D6] rounded-xl text-[#281A0E] focus:outline-none focus:border-[#E8742A] transition-colors"
              />
            </FormField>

            {/* 품종 */}
            <FormField label="품종" helper="예: 말티즈, 푸들, 코리안 숏헤어">
              <input
                value={form.breed}
                onChange={(e) => update("breed", e.target.value)}
                placeholder="품종을 직접 입력해주세요"
                className="w-full h-11 px-4 border border-[#FFE9D6] rounded-xl text-[#281A0E] placeholder-[#6B7280] focus:outline-none focus:border-[#E8742A] transition-colors"
              />
            </FormField>

            {/* 나이 + 몸무게 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="나이">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => update("age", Number(e.target.value))}
                    className="flex-1 h-11 px-4 border border-[#FFE9D6] rounded-xl text-[#281A0E] focus:outline-none focus:border-[#E8742A] transition-colors"
                  />
                  <span className="text-sm text-[#6B7280]">살</span>
                </div>
              </FormField>
              <FormField label="몸무게">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => update("weight", Number(e.target.value))}
                    className="flex-1 h-11 px-4 border border-[#FFE9D6] rounded-xl text-[#281A0E] focus:outline-none focus:border-[#E8742A] transition-colors"
                  />
                  <span className="text-sm text-[#6B7280]">kg</span>
                </div>
              </FormField>
            </div>

            {/* 성별 */}
            <FormField label="성별">
              <div className="flex gap-3">
                {(["수컷", "암컷"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => update("gender", g)}
                    className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.gender === g
                        ? "border-[#E8742A] bg-[#FFF8F3] text-[#E8742A]"
                        : "border-[#FFE9D6] text-[#6B7280]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 주의사항 */}
            <FormField label="주의사항">
              <textarea
                value={form.caution}
                onChange={(e) => update("caution", e.target.value)}
                placeholder="돌봄 시 주의사항을 자유롭게 작성해주세요"
                className="w-full px-4 py-3 border border-[#FFE9D6] rounded-xl text-[#281A0E] placeholder-[#6B7280] focus:outline-none focus:border-[#E8742A] transition-colors resize-none"
                style={{ minHeight: 100 }}
              />
            </FormField>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-8 pb-7 pt-5 border-t border-[#FFE9D6] flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-2 h-12 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
          >
            저장하기
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#281A0E] mb-1.5">
        {label}
      </label>
      {helper && <p className="text-xs text-[#6B7280] mb-1.5">{helper}</p>}
      {children}
    </div>
  );
}

function PetCard({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group bg-white border border-[#FFE9D6] rounded-2xl overflow-hidden hover:border-[#E8742A] hover:shadow-[0_2px_12px_rgba(232,116,42,0.10)] transition-all cursor-default">
      {/* 사진 영역 */}
      <div
        className="relative h-45 flex items-center justify-center text-6xl"
        style={{
          background: `linear-gradient(135deg, ${pet.bgFrom}, ${pet.bgTo})`,
        }}
      >
        {pet.emoji}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#FFE9D6]">
          <span className="text-xs font-semibold text-[#E8742A]">
            {ANIMAL_TYPE_LABEL[pet.animal_type]}
          </span>
        </div>
      </div>

      {/* 정보 */}
      <div className="p-5">
        <h3 className="font-bold text-[#281A0E] mb-0.5">{pet.name}</h3>
        <p className="text-sm text-[#6B7280] mb-1">{pet.breed}</p>
        <p className="text-sm text-[#6B7280]">
          {pet.age}살 · {pet.weight}kg · {pet.gender}
        </p>

        <div className="border-t border-[#FFE9D6] mt-4 pt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 h-9 rounded-xl border border-[#FFE9D6] text-sm font-medium text-[#6B7280] hover:border-[#E8742A]/50 hover:text-[#E8742A] transition-colors flex items-center justify-center gap-1.5"
          >
            <Pencil size={13} /> 수정하기
          </button>
          <button
            onClick={onDelete}
            className="h-9 px-4 rounded-xl text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function PetCardMobile({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-4 flex gap-4 items-center">
      <div
        className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl shrink-0"
        style={{
          background: `linear-gradient(135deg, ${pet.bgFrom}, ${pet.bgTo})`,
        }}
      >
        {pet.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-[#281A0E]">{pet.name}</span>
          <span className="text-xs px-2 py-0.5 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-[#E8742A]">
            {ANIMAL_TYPE_LABEL[pet.animal_type]}
          </span>
        </div>
        <p className="text-sm text-[#6B7280]">{pet.breed}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">
          {pet.age}살 · {pet.weight}kg
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onEdit}
            className="h-8 px-3 rounded-lg border border-[#FFE9D6] text-xs font-medium text-[#6B7280] hover:border-[#E8742A]/50 hover:text-[#E8742A] transition-colors flex items-center gap-1"
          >
            <Pencil size={11} /> 수정
          </button>
          <button
            onClick={onDelete}
            className="h-8 px-3 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <Trash2 size={11} /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-[#FFF0E8] rounded-full flex items-center justify-center mb-6">
        <PawPrint size={40} className="text-[#E8742A]" />
      </div>
      <h3 className="text-xl font-bold text-[#281A0E] mb-2">
        등록된 반려동물이 없어요
      </h3>
      <p className="text-sm text-[#6B7280] mb-8">
        반려동물을 등록하고 돌봄 서비스를 이용해보세요
      </p>
      <button
        onClick={onAdd}
        className="h-12 px-8 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        반려동물 등록하기
      </button>
    </div>
  );
}

// 페이지

type ModalType = "delete" | "success" | "edit" | "select" | "guide" | null;

export default function MyPetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [modal, setModal] = useState<ModalType>(null);
  const [targetPet, setTargetPet] = useState<Pet | null>(null);

  const openDelete = (pet: Pet) => {
    setTargetPet(pet);
    setModal("delete");
  };
  const openEdit = (pet: Pet) => {
    setTargetPet(pet);
    setModal("edit");
  };

  const handleDelete = () => {
    if (!targetPet) return;
    setPets((prev) => prev.filter((p) => p.id !== targetPet.id));
    setModal(null);
  };

  const handleSaveEdit = (updated: Pet) => {
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setModal(null);
  };

  const handleAddPet = () => router.push("/pet-register");

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <div className="hidden md:block">
        <Header />
      </div>

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">
            내 반려동물
          </span>
          <button
            onClick={handleAddPet}
            className="h-9 px-4 rounded-xl bg-[#E8742A] text-white text-sm font-semibold flex items-center gap-1"
          >
            <Plus size={15} /> 추가
          </button>
        </div>
      </div>

      {/* 데스크탑 콘텐츠 */}
      <div className="hidden md:block w-full max-w-[1200px] mx-auto px-6 pt-10 pb-20">
        {/* 상단 영역 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
            >
              <ChevronLeft size={20} className="text-[#281A0E]" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[#281A0E]">내 반려동물</h2>
              <p className="text-sm text-[#6B7280] mt-1">
                등록된 반려동물을 관리할 수 있어요
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setModal("select")}
              className="h-11 px-5 rounded-xl border border-[#FFE9D6] text-[#6B7280] font-medium hover:border-[#E8742A]/50 hover:text-[#E8742A] transition-colors text-sm"
            >
              반려동물 선택
            </button>
            <button
              onClick={handleAddPet}
              className="h-11 px-5 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> 반려동물 추가
            </button>
          </div>
        </div>

        {pets.length === 0 ? (
          <EmptyState onAdd={handleAddPet} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onEdit={() => openEdit(pet)}
                onDelete={() => openDelete(pet)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 모바일 콘텐츠 */}
      <div className="md:hidden px-4 pt-4 pb-28">
        {pets.length === 0 ? (
          <EmptyState onAdd={handleAddPet} />
        ) : (
          <div className="flex flex-col gap-3">
            {pets.map((pet) => (
              <PetCardMobile
                key={pet.id}
                pet={pet}
                onEdit={() => openEdit(pet)}
                onDelete={() => openDelete(pet)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 모바일 추가 버튼 */}
      <button
        onClick={handleAddPet}
        className="md:hidden fixed bottom-22 right-5 w-14 h-14 bg-[#E8742A] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(232,116,42,0.4)] hover:bg-[#D4621A] transition-colors z-30"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* 모달 */}
      {/* 반려동물 삭제 기능 모달 */}
      <CustomModal
        open={modal === "delete" && targetPet !== null}
        preset="deletePost"
        title={`${targetPet?.name ?? "반려동물"}의 정보를 삭제하시겠어요?`}
        description="삭제된 정보는 복구할 수 없습니다."
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
      />

      {/* 반려동물 등록 완료 기능 모달 */}
      <CustomModal
        open={modal === "success" && targetPet !== null}
        preset="success"
        title="등록이 완료되었어요"
        description={`${targetPet?.name ?? "반려동물"}이(가) 등록되었습니다.\n이제 돌봄 요청 시 선택할 수 있습니다.`}
        cancelText="확인"
        confirmText="내 반려동물 보기"
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      />
      {modal === "edit" && targetPet && (
        <EditModal
          pet={targetPet}
          onClose={() => setModal(null)}
          onSave={handleSaveEdit}
        />
      )}
      {modal === "select" && (
        <SelectionModal pets={pets} onClose={() => setModal(null)} />
      )}
      {modal === "guide" && (
        <GuideModal onRegister={handleAddPet} onLater={() => setModal(null)} />
      )}
    </div>
  );
}
