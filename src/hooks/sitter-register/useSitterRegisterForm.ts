"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sitterRegisterSchema,
  STEP_FIELDS,
} from "@/schemas/sitterRegister";
import type { SitterRegisterFormValues } from "@/types/sitterRegister";

const TOTAL_STEPS = 3;

export function useSitterRegisterForm() {
  const [step, setStep] = useState(1);

  const form = useForm<SitterRegisterFormValues>({
    resolver: zodResolver(sitterRegisterSchema),
    mode: "onSubmit",
    defaultValues: {
      profilePhotoFile: null,
      location: null,
      introduction: "",
      career: "",
      selectedServices: [],
      selectedAnimals: [],
      certificateFiles: [],
      activityPhotoFiles: [],
    },
  });

  const goNext = async () => {
    const fields = STEP_FIELDS[step as 1 | 2 | 3];
    const valid = await form.trigger(
      fields as unknown as (keyof SitterRegisterFormValues)[],
    );
    if (!valid) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  return { form, step, goNext, goPrev, totalSteps: TOTAL_STEPS };
}
