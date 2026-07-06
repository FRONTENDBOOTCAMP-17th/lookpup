"use client";

import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Camera } from "lucide-react";
import LocationPickerWithMap from "@/components/LocationPickerWithMap";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CAREER_OPTIONS } from "@/lib/sitterRegister";
import { useSingleImageUpload } from "@/hooks/useImageUpload";
import type { SitterRegisterFormValues } from "@/types/sitterRegister";

const labelCls = "text-stone-900 text-sm font-medium leading-5 block";

interface SitterRegisterStep1Props {
  form: UseFormReturn<SitterRegisterFormValues>;
}

export default function SitterRegisterStep1({ form }: SitterRegisterStep1Props) {
  const {
    control,
    watch,
    formState: { errors },
  } = form;
  const { preview, onSelect } = useSingleImageUpload();
  const [previewOpen, setPreviewOpen] = useState(false);
  const introduction = watch("introduction");

  return (
    <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
      <h2 className="text-lg font-semibold text-[#281a0e]">
        기본 정보를 입력해주세요
      </h2>
      <p className="text-gray-400 text-sm mt-1">
        펫시터로 활동하기 위한 정보를 입력합니다
      </p>

      <div className="mt-6">
        <label className={labelCls}>프로필 사진</label>
        <Controller
          control={control}
          name="profilePhotoFile"
          render={({ field }) => (
            <label className="mt-3 w-24 h-24 bg-[#fff8f3] rounded-full border border-[#ffe9d6] flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer overflow-hidden">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    e.preventDefault();
                    setPreviewOpen(true);
                  }}
                />
              ) : (
                <Camera className="w-7 h-7 text-gray-500" strokeWidth={2} />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = onSelect(e);
                  if (file) field.onChange(file);
                }}
              />
            </label>
          )}
        />
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogTitle>프로필 사진 미리보기</DialogTitle>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="프로필 사진 확대 미리보기"
              className="w-full rounded-xl object-cover"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <label className={`${labelCls} mb-2`}>활동 지역</label>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <LocationPickerWithMap value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.location && (
          <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
        )}
      </div>

      <div className="mt-6">
        <label className={`${labelCls} mb-2`}>자기소개 *</label>
        <Controller
          control={control}
          name="introduction"
          render={({ field }) => (
            <textarea
              value={field.value}
              onChange={(e) => field.onChange(e.target.value.slice(0, 500))}
              placeholder="펫시터 경력, 반려동물 돌봄 경험 등을 작성해주세요"
              rows={6}
              className="w-full px-4 py-3 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 placeholder:text-stone-900/50 leading-6 resize-none focus:outline-none focus:border-[var(--color-orange-500)] transition-all"
            />
          )}
        />
        <div className="flex justify-between pt-1">
          <span className="text-red-500 text-xs">{errors.introduction?.message}</span>
          <span className="text-gray-400 text-xs font-normal leading-4">
            {introduction.length}/500
          </span>
        </div>
      </div>

      <div className="mt-2">
        <label className={`${labelCls} mb-2`}>경력 *</label>
        <Controller
          control={control}
          name="career"
          render={({ field }) => (
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full h-11 px-4 bg-white rounded-xl border border-[#ffe9d6] text-base font-normal text-stone-900 focus:outline-none focus:border-[var(--color-orange-500)] transition-all appearance-none cursor-pointer"
            >
              <option value="">펫시터 경력 선택</option>
              {CAREER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.career && (
          <p className="text-sm text-red-500 mt-1">{errors.career.message}</p>
        )}
      </div>
    </div>
  );
}
