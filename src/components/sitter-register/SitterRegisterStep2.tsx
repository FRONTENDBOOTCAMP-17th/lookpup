"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { SERVICES } from "@/lib/sitterRegister";
import type { SitterRegisterFormValues } from "@/types/sitterRegister";

interface SitterRegisterStep2Props {
  form: UseFormReturn<SitterRegisterFormValues>;
}

export default function SitterRegisterStep2({ form }: SitterRegisterStep2Props) {
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <div className="bg-white rounded-2xl border border-[#ffe9d6] p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#281a0e]">
          제공 서비스를 선택해주세요
        </h2>
        <span className="text-xs text-gray-500">중복 선택 가능</span>
      </div>
      <p className="text-gray-400 text-sm mt-1">
        제공 가능한 서비스를 모두 선택하세요
      </p>

      <Controller
        control={control}
        name="selectedServices"
        render={({ field }) => (
          <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-4">
            {SERVICES.map((service) => {
              const isSelected = field.value.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() =>
                    field.onChange(
                      isSelected
                        ? field.value.filter((s) => s !== service.id)
                        : [...field.value, service.id],
                    )
                  }
                  className={`p-4 bg-white rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-[var(--color-orange-500)] bg-[#fff8f3]"
                      : "border-[#ffe9d6] hover:border-[var(--color-orange-500)]/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl leading-9">{service.emoji}</span>
                    <div>
                      <p
                        className={`text-base font-semibold leading-6 ${
                          isSelected
                            ? "text-[var(--color-orange-500)]"
                            : "text-stone-900"
                        }`}
                      >
                        {service.title}
                      </p>
                      <p className="text-gray-500 text-sm font-normal leading-5 pt-1">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.selectedServices && (
        <p className="text-sm text-red-500 mt-3">
          {errors.selectedServices.message}
        </p>
      )}
    </div>
  );
}
