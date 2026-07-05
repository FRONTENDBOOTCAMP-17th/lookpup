"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
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
import { MobileBackButton, DesktopBackButton } from "@/components/common/BackButton";
import { CustomModal } from "@/components/common/CustomModal";
import { updatePet, deletePet } from "@/app/actions/pets";

type AnimalType = "dog" | "cat" | "other";
type Gender = "MALE" | "FEMALE" | "MALE_NEUTERED" | "FEMALE_NEUTERED";

interface Pet {
  id: string;
  name: string;
  animal_type: AnimalType;
  breed: string | null;
  age: number | null;
  weight: number | null;
  gender: Gender;
  caution: string | null;
  image_url: string | null;
}

export type PetRow = {
  id: string;
  name: string;
  animal_type: string;
  breed: string | null;
  age: number | null;
  gender: string;
  weight: number | null;
  image_url: string | null;
  caution: string | null;
};

function toPet(r: PetRow): Pet {
  return {
    id: r.id,
    name: r.name,
    animal_type: (["dog", "cat"].includes(r.animal_type)
      ? r.animal_type
      : "other") as AnimalType,
    breed: r.breed,
    age: r.age,
    weight: r.weight,
    gender: (["MALE", "FEMALE", "MALE_NEUTERED", "FEMALE_NEUTERED"].includes(r.gender)
      ? r.gender
      : "MALE") as Gender,
    caution: r.caution,
    image_url: r.image_url,
  };
}

const ANIMAL_TYPE_LABEL: Record<AnimalType, string> = {
  dog: "강아지",
  cat: "고양이",
  other: "기타",
};

const ANIMAL_VISUAL: Record<
  AnimalType,
  { emoji: string; bgFrom: string; bgTo: string }
> = {
  dog: { emoji: "🐶", bgFrom: "#FDE8C4", bgTo: "#FAD7A0" },
  cat: { emoji: "🐱", bgFrom: "#D6EAF8", bgTo: "#AED6F1" },
  other: { emoji: "🐾", bgFrom: "#D5F5E3", bgTo: "#A9DFBF" },
};

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "수컷",
  FEMALE: "암컷",
  MALE_NEUTERED: "수컷(중성화)",
  FEMALE_NEUTERED: "암컷(중성화)",
};

function isNeutered(gender: Gender) {
  return gender === "MALE_NEUTERED" || gender === "FEMALE_NEUTERED";
}

function genderSex(gender: Gender): "MALE" | "FEMALE" {
  return gender === "MALE" || gender === "MALE_NEUTERED" ? "MALE" : "FEMALE";
}

function combineGender(sex: "MALE" | "FEMALE", neutered: boolean): Gender {
  if (sex === "MALE") return neutered ? "MALE_NEUTERED" : "MALE";
  return neutered ? "FEMALE_NEUTERED" : "FEMALE";
}


function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
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
      <div className="bg-white rounded-[20px] w-[460px] max-w-[calc(100vw-32px)] p-8 shadow-[0_12px_16px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-[var(--color-orange-500)]" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">
            등록된 정보를 삭제하시겠어요?
          </h3>
          <p className="text-sm text-gray-500 mb-6">삭제된 정보는 복구할 수 없습니다.</p>

          <div className="w-full flex items-center gap-3 p-4 bg-orange-50 rounded-xl mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${ANIMAL_VISUAL[pet.animal_type].bgFrom}, ${ANIMAL_VISUAL[pet.animal_type].bgTo})`,
              }}
            >
              {ANIMAL_VISUAL[pet.animal_type].emoji}
            </div>
            <div className="text-left">
              <p className="font-semibold text-stone-900">{pet.name}</p>
              <p className="text-sm text-gray-500">{pet.breed ?? "품종 미입력"}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function BulkDeleteModal({
  count,
  onClose,
  onConfirm,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-[460px] max-w-[calc(100vw-32px)] p-8 shadow-[0_12px_16px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-[var(--color-orange-500)]" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">
            등록된 정보를 삭제하시겠어요?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            선택한 반려동물 {count}마리를 삭제합니다.
            <br />
            삭제된 정보는 복구할 수 없습니다.
          </p>

          <div className="w-full flex items-center gap-3 p-4 bg-orange-50 rounded-xl mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8C4] flex items-center justify-center text-2xl shrink-0">
              🐾
            </div>
            <div className="text-left">
              <p className="font-semibold text-stone-900">{count}마리 선택됨</p>
              <p className="text-sm text-gray-500">선택된 반려동물이 모두 삭제됩니다</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 transition-colors"
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
  petName,
  onClose,
}: {
  petName: string;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <Backdrop>
      <div className="bg-white rounded-[20px] w-[480px] max-w-[calc(100vw-32px)] p-8 shadow-[0_12px_16px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-[var(--color-orange-500)]" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">등록이 완료되었어요</h3>
          <p className="text-sm text-gray-500 mb-6">이제 돌봄 요청 시 선택할 수 있습니다.</p>

          <div className="w-full flex items-center gap-3 p-4 bg-orange-50 rounded-xl mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8C4] flex items-center justify-center text-2xl shrink-0">
              🐾
            </div>
            <div className="text-left">
              <p className="font-semibold text-stone-900">{petName}</p>
              <p className="text-sm text-gray-500">방금 등록됨</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 transition-colors"
            >
              확인
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              내 반려동물 보기
            </button>
          </div>
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
      <label className="block text-sm font-semibold text-stone-900 mb-1.5">{label}</label>
      {helper && <p className="text-xs text-gray-500 mb-1.5">{helper}</p>}
      {children}
    </div>
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
  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed ?? "");
  const [age, setAge] = useState(pet.age != null ? String(pet.age) : "");
  const [weight, setWeight] = useState(pet.weight != null ? String(pet.weight) : "");
  const [sex, setSex] = useState<"MALE" | "FEMALE">(genderSex(pet.gender));
  const [neutered, setNeutered] = useState(isNeutered(pet.gender));
  const [caution, setCaution] = useState(pet.caution ?? "");
  const [saving, setSaving] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const visual = ANIMAL_VISUAL[pet.animal_type];

  const handleSave = async () => {
    setSaving(true);
    const result = await updatePet(pet.id, {
      name: name.trim(),
      breed: breed.trim() || null,
      age: age ? parseInt(age) : 0,
      weight: weight ? parseFloat(weight) : 0,
      gender: combineGender(sex, neutered),
      caution: caution.trim() || null,
    });
    setSaving(false);

    if (result.error) {
      setEditErrorMessage(result.error.message);
      return;
    }

    onSave({
      ...pet,
      name: name.trim(),
      breed: breed.trim() || null,
      age: age ? parseInt(age) : 0,
      weight: weight ? parseFloat(weight) : 0,
      gender: combineGender(sex, neutered),
      caution: caution.trim() || null,
    });
  };

  return (
    <>
      <Backdrop>
        <div className="bg-white rounded-[20px] w-180 max-w-full shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-8 pt-7 pb-5 border-b border-orange-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-bold text-stone-900">반려동물 정보 수정</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-8 py-6">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" />

            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div
                  className="w-25 h-25 rounded-full flex items-center justify-center text-5xl"
                  style={{
                    background: `linear-gradient(135deg, ${visual.bgFrom}, ${visual.bgTo})`,
                  }}
                >
                  {visual.emoji}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--color-orange-500)] rounded-full flex items-center justify-center shadow"
                >
                  <Camera size={15} className="text-white" />
                </button>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 text-sm text-[var(--color-orange-500)] font-medium hover:underline"
              >
                사진 변경
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <FormField label="이름">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 border border-orange-100 rounded-xl text-stone-900 focus:outline-none focus:border-[var(--color-orange-500)] transition-colors"
                />
              </FormField>

              <FormField label="품종" helper="예: 말티즈, 푸들, 코리안 숏헤어">
                <input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="품종을 직접 입력해주세요"
                  className="w-full h-11 px-4 border border-orange-100 rounded-xl text-stone-900 placeholder-gray-500 focus:outline-none focus:border-[var(--color-orange-500)] transition-colors"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="나이">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="flex-1 min-w-0 h-11 px-4 border border-orange-100 rounded-xl text-stone-900 focus:outline-none focus:border-[var(--color-orange-500)] transition-colors"
                    />
                    <span className="shrink-0 text-sm text-gray-500">살</span>
                  </div>
                </FormField>
                <FormField label="몸무게">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="flex-1 min-w-0 h-11 px-4 border border-orange-100 rounded-xl text-stone-900 focus:outline-none focus:border-[var(--color-orange-500)] transition-colors"
                    />
                    <span className="shrink-0 text-sm text-gray-500">kg</span>
                  </div>
                </FormField>
              </div>

              <FormField label="성별">
                <div className="flex gap-3">
                  {(["MALE", "FEMALE"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSex(g)}
                      className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                        sex === g
                          ? "border-[var(--color-orange-500)] bg-orange-50 text-[var(--color-orange-500)]"
                          : "border-orange-100 text-gray-500"
                      }`}
                    >
                      {g === "MALE" ? "수컷" : "암컷"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNeutered((prev) => !prev)}
                  className="mt-2 flex items-center gap-2 text-sm text-gray-500"
                >
                  <span
                    className={`size-4 rounded-sm border flex items-center justify-center ${
                      neutered
                        ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)]"
                        : "border-gray-300"
                    }`}
                  >
                    {neutered && <Check size={11} className="text-white" />}
                  </span>
                  중성화 했어요
                </button>
              </FormField>

              <FormField label="주의사항">
                <textarea
                  value={caution}
                  onChange={(e) => setCaution(e.target.value)}
                  placeholder="돌봄 시 주의사항을 자유롭게 작성해주세요"
                  className="w-full px-4 py-3 border border-orange-100 rounded-xl text-stone-900 placeholder-gray-500 focus:outline-none focus:border-[var(--color-orange-500)] transition-colors resize-none"
                  style={{ minHeight: 100 }}
                />
              </FormField>
            </div>
          </div>

          <div className="px-8 pb-7 pt-5 border-t border-orange-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-2 h-12 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </Backdrop>
      <CustomModal
        open={!!editErrorMessage}
        type="error"
        title="오류가 발생했습니다."
        description={editErrorMessage ?? undefined}
        confirmText="확인"
        onConfirm={() => setEditErrorMessage(null)}
        onClose={() => setEditErrorMessage(null)}
        showCloseButton={false}
      />
    </>
  );
}

function PetCard({
  pet,
  onEdit,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      onClick={isSelectionMode ? onSelect : undefined}
      className={`group bg-white border rounded-2xl overflow-hidden transition-all ${
        isSelectionMode
          ? `cursor-pointer ${
              isSelected
                ? "border-[var(--color-orange-500)] shadow-[0_0_0_3px_rgba(232,116,42,0.15)]"
                : "border-orange-100 hover:border-[var(--color-orange-500)]/40"
            }`
          : "border-orange-100 hover:border-[var(--color-orange-500)] hover:shadow-[0_2px_12px_rgba(232,116,42,0.10)] cursor-default"
      }`}
    >
      <div
        className="relative h-45 flex items-center justify-center"
        style={
          pet.image_url
            ? undefined
            : {
                background: `linear-gradient(135deg, ${ANIMAL_VISUAL[pet.animal_type].bgFrom}, ${ANIMAL_VISUAL[pet.animal_type].bgTo})`,
              }
        }
      >
        {pet.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl leading-none">{ANIMAL_VISUAL[pet.animal_type].emoji}</span>
        )}
        <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full border border-orange-100">
          <span className="text-xs font-semibold text-[var(--color-orange-500)]">
            {ANIMAL_TYPE_LABEL[pet.animal_type]}
          </span>
        </div>
        {isSelectionMode && (
          <div
            className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)]"
                : "bg-white/80 border-gray-300"
            }`}
          >
            {isSelected && <Check size={13} className="text-white" />}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-stone-900 mb-0.5">{pet.name}</h3>
        <p className="text-sm text-gray-500 mb-1">{pet.breed ?? "품종 미입력"}</p>
        <p className="text-sm text-gray-500">
          {pet.age ?? "-"}살 · {pet.weight ?? "-"}kg · {GENDER_LABEL[pet.gender]}
        </p>

        {!isSelectionMode && (
          <div className="border-t border-orange-100 mt-4 pt-4 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex-1 h-9 rounded-xl border border-orange-100 text-sm font-medium text-gray-500 hover:border-[var(--color-orange-500)]/50 hover:text-[var(--color-orange-500)] transition-colors flex items-center justify-center gap-1.5"
            >
              <Pencil size={13} /> 수정하기
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-9 px-4 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PetCardMobile({
  pet,
  onEdit,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      onClick={isSelectionMode ? onSelect : undefined}
      className={`bg-white border rounded-2xl p-4 flex gap-4 items-center transition-all ${
        isSelectionMode
          ? `cursor-pointer ${
              isSelected
                ? "border-[var(--color-orange-500)] shadow-[0_0_0_3px_rgba(232,116,42,0.15)]"
                : "border-orange-100 hover:border-[var(--color-orange-500)]/40"
            }`
          : "border-orange-100"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-4xl"
          style={
            pet.image_url
              ? undefined
              : {
                  background: `linear-gradient(135deg, ${ANIMAL_VISUAL[pet.animal_type].bgFrom}, ${ANIMAL_VISUAL[pet.animal_type].bgTo})`,
                }
          }
        >
          {pet.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            ANIMAL_VISUAL[pet.animal_type].emoji
          )}
        </div>
        {isSelectionMode && (
          <div
            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-[var(--color-orange-500)] border-[var(--color-orange-500)]"
                : "bg-white border-gray-300"
            }`}
          >
            {isSelected && <Check size={13} className="text-white" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-stone-900">{pet.name}</span>
            <span className="text-xs px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-[var(--color-orange-500)]">
              {ANIMAL_TYPE_LABEL[pet.animal_type]}
            </span>
          </div>
          <p className="text-sm text-gray-500">{pet.breed ?? "품종 미입력"}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {pet.age ?? "-"}살 · {pet.weight ?? "-"}kg
          </p>
        </div>
        {!isSelectionMode && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 px-3 rounded-lg border border-orange-100 text-xs font-medium text-gray-500 hover:border-[var(--color-orange-500)]/50 hover:text-[var(--color-orange-500)] transition-colors flex items-center gap-1"
            >
              <Pencil size={11} /> 수정
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 px-3 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
        <PawPrint size={40} className="text-[var(--color-orange-500)]" />
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">등록된 반려동물이 없어요</h3>
      <p className="text-sm text-gray-500 mb-8">
        반려동물을 등록하고 돌봄 서비스를 이용해보세요
      </p>
      <button
        onClick={onAdd}
        className="h-12 px-8 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        반려동물 등록하기
      </button>
    </div>
  );
}

type ModalType = "delete" | "bulk-delete" | "success" | "edit" | null;

interface MyPetsClientProps {
  initialPets: PetRow[];
}

export default function MyPetsClient({ initialPets }: MyPetsClientProps) {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>(initialPets.map(toPet));
  const [modal, setModal] = useState<ModalType>(null);
  const [targetPet, setTargetPet] = useState<Pet | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; description?: string } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const openDelete = (pet: Pet) => { setTargetPet(pet); setModal("delete"); };
  const openEdit = (pet: Pet) => { setTargetPet(pet); setModal("edit"); };

  const enterSelectionMode = () => { setIsSelectionMode(true); setSelectedIds([]); };
  const exitSelectionMode = () => { setIsSelectionMode(false); setSelectedIds([]); };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleDelete = async () => {
    if (!targetPet) return;
    const result = await deletePet(targetPet.id);
    if (result.error) {
      setErrorModal({ title: "오류가 발생했습니다.", description: result.error.message });
      return;
    }
    setPets((prev) => prev.filter((p) => p.id !== targetPet.id));
    setModal(null);
  };

  const handleBulkDelete = async () => {
    const results = await Promise.all(selectedIds.map((id) => deletePet(id)));
    const failedIds = selectedIds.filter((_, i) => results[i].error);
    const failedMessages = results.filter((r) => r.error).map((r) => r.error!.message);

    setPets((prev) =>
      prev.filter((p) => !selectedIds.includes(p.id) || failedIds.includes(p.id)),
    );
    setSelectedIds([]);
    setIsSelectionMode(false);
    setModal(null);

    if (failedMessages.length > 0) {
      setErrorModal({ title: "일부 삭제에 실패했습니다.", description: failedMessages.join("\n") });
    }
  };

  const handleSaveEdit = (updated: Pet) => {
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setTargetPet(updated);
    setModal("success");
  };

  const handleAddPet = () => router.push("/pet-register");

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          {isSelectionMode ? (
            <>
              <button
                onClick={exitSelectionMode}
                className="text-sm font-medium text-gray-500 shrink-0"
              >
                취소
              </button>
              <span className="flex-1 font-semibold text-stone-900 text-center">
                {selectedIds.length > 0 ? `${selectedIds.length}마리 선택됨` : "반려동물 선택"}
              </span>
              <button
                onClick={() => setModal("bulk-delete")}
                disabled={selectedIds.length === 0}
                className="h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-1 shrink-0 disabled:text-gray-300 text-red-500"
              >
                <Trash2 size={14} /> 삭제
              </button>
            </>
          ) : (
            <>
              <MobileBackButton />
              <span className="flex-1 font-semibold text-stone-900">내 반려동물</span>
              {pets.length > 0 && (
                <button
                  onClick={enterSelectionMode}
                  className="h-9 px-3 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium"
                >
                  선택
                </button>
              )}
              <button
                onClick={handleAddPet}
                className="h-9 px-4 rounded-xl bg-orange-500 text-white text-sm font-semibold flex items-center gap-1 hover:bg-orange-600 transition-colors"
              >
                <Plus size={15} /> 추가
              </button>
            </>
          )}
        </div>
      </div>

      {/* 데스크탑 콘텐츠 */}
      <div className="hidden md:block w-full max-w-[1280px] mx-auto px-4 sm:px-10 pt-10 pb-20">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <DesktopBackButton />
            <div>
              <h2 className="text-2xl font-bold text-stone-900">내 반려동물</h2>
              <p className="text-sm text-gray-500 mt-1">등록된 반려동물을 관리할 수 있어요</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {isSelectionMode ? (
              <>
                {selectedIds.length > 0 && (
                  <span className="text-sm text-gray-500">{selectedIds.length}마리 선택됨</span>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="h-11 px-5 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 transition-colors text-sm"
                >
                  선택 취소
                </button>
                <button
                  onClick={() => setModal("bulk-delete")}
                  disabled={selectedIds.length === 0}
                  className="h-11 px-5 rounded-xl bg-[var(--color-orange-500)] text-white font-semibold hover:bg-orange-600 disabled:bg-orange-100 disabled:text-gray-500 transition-colors flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> 삭제하기
                </button>
              </>
            ) : (
              <>
                {pets.length > 0 && (
                  <button
                    onClick={enterSelectionMode}
                    className="h-11 px-5 rounded-xl border border-orange-100 text-gray-500 font-medium hover:border-[var(--color-orange-500)]/50 hover:text-[var(--color-orange-500)] transition-colors text-sm"
                  >
                    반려동물 선택
                  </button>
                )}
                <button
                  onClick={handleAddPet}
                  className="h-11 px-5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> 반려동물 추가
                </button>
              </>
            )}
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
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(pet.id)}
                onSelect={() => toggleSelection(pet.id)}
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
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(pet.id)}
                onSelect={() => toggleSelection(pet.id)}
              />
            ))}
          </div>
        )}
      </div>

      {!isSelectionMode && (
        <button
          onClick={handleAddPet}
          className="md:hidden fixed bottom-22 right-5 w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(249,115,22,0.4)] hover:bg-orange-600 transition-colors z-30"
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

      {modal === "delete" && targetPet && (
        <DeleteModal
          pet={targetPet}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
      {modal === "bulk-delete" && (
        <BulkDeleteModal
          count={selectedIds.length}
          onClose={() => setModal(null)}
          onConfirm={handleBulkDelete}
        />
      )}
      {modal === "success" && targetPet && (
        <SuccessModal
          petName={targetPet.name}
          onClose={() => setModal(null)}
          onView={() => setModal(null)}
        />
      )}
      {modal === "edit" && targetPet && (
        <EditModal
          pet={targetPet}
          onClose={() => setModal(null)}
          onSave={handleSaveEdit}
        />
      )}
      <CustomModal
        open={!!errorModal}
        type="error"
        title={errorModal?.title ?? "오류가 발생했습니다."}
        description={errorModal?.description}
        confirmText="확인"
        onConfirm={() => setErrorModal(null)}
        onClose={() => setErrorModal(null)}
        showCloseButton={false}
      />
    </div>
  );
}
