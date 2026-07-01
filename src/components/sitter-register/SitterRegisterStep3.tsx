"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Camera, Plus, X } from "lucide-react";
import { ANIMALS } from "@/lib/sitterRegister";
import { useMultiFileUpload } from "@/hooks/useImageUpload";
import CheckboxCard from "@/components/sitter-register/CheckboxCard";
import type { SitterRegisterFormValues } from "@/types/sitterRegister";

const labelCls = "text-stone-900 text-sm font-medium leading-5 block";

interface SitterRegisterStep3Props {
  form: UseFormReturn<SitterRegisterFormValues>;
  submitError: string | null;
}

export default function SitterRegisterStep3({
  form,
  submitError,
}: SitterRegisterStep3Props) {
  const {
    control,
    formState: { errors },
  } = form;
  const certificates = useMultiFileUpload();
  const activityPhotos = useMultiFileUpload();

  return (
    <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
      <h2 className="text-stone-900 text-xl font-bold leading-7">
        자격증을 등록해주세요
      </h2>
      <p className="text-gray-500 text-sm font-normal leading-5 pt-2">
        선택사항이지만 신뢰도를 높일 수 있습니다
      </p>

      <Controller
        control={control}
        name="certificateFiles"
        render={({ field }) => (
          <>
            <label className="mt-6 w-full h-28 rounded-2xl outline-2 outline-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors cursor-pointer">
              <Camera className="w-8 h-8 text-gray-500" strokeWidth={2} />
              <span className="text-gray-500 text-sm font-normal leading-5">
                자격증 파일 추가
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const added = certificates.onAdd(e);
                  field.onChange([...field.value, ...added]);
                }}
              />
            </label>

            {field.value.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {field.value.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-lg text-sm text-stone-700"
                  >
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        field.onChange(field.value.filter((_, idx) => idx !== i))
                      }
                      className="text-gray-400 hover:text-red-400 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      />

      <div className="pt-6">
        <label className={`${labelCls} mb-3`}>돌봄 가능 동물</label>
        <Controller
          control={control}
          name="selectedAnimals"
          render={({ field }) => (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              {ANIMALS.map((animal) => (
                <CheckboxCard
                  key={animal.id}
                  label={animal.label}
                  checked={field.value.includes(animal.id)}
                  onToggle={() =>
                    field.onChange(
                      field.value.includes(animal.id)
                        ? field.value.filter((a) => a !== animal.id)
                        : [...field.value, animal.id],
                    )
                  }
                />
              ))}
            </div>
          )}
        />
        {errors.selectedAnimals && (
          <p className="text-sm text-red-500 mt-2">
            {errors.selectedAnimals.message}
          </p>
        )}
      </div>

      <div className="pt-6 pb-6">
        <label className={`${labelCls} mb-3`}>활동 사진</label>
        <Controller
          control={control}
          name="activityPhotoFiles"
          render={({ field }) => (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {activityPhotos.previews.map((src, i) => (
                <div key={i} className="relative w-full aspect-square">
                  <img
                    src={src}
                    alt={`활동 사진 ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      activityPhotos.removeAt(i);
                      field.onChange(field.value.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {activityPhotos.previews.length < 10 && (
                <label className="w-full aspect-square rounded-xl outline-2 outline-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors cursor-pointer">
                  <Plus className="w-6 h-6 text-gray-500" strokeWidth={2} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const added = activityPhotos.onAdd(e, true);
                      field.onChange([...field.value, ...added]);
                    }}
                  />
                </label>
              )}
            </div>
          )}
        />
      </div>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}
    </div>
  );
}
