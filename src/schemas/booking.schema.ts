import { z } from "zod";

const dateRangeSchema = z.object({
  from: z.date({ message: "시작일을 선택해주세요." }),
  to: z.date().optional(),
});

export const step1Schema = z
  .object({
    dateRange: dateRangeSchema,
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startTime && d.endTime && d.startTime >= d.endTime) return false;
      return true;
    },
    { message: "종료 시간은 시작 시간보다 늦어야 합니다.", path: ["endTime"] },
  )
  .refine(
    (d) => {
      if (!d.startTime) return true;
      const [h, m] = d.startTime.split(":").map(Number);
      const dt = new Date(d.dateRange.from);
      dt.setHours(h, m, 0, 0);
      return dt > new Date();
    },
    { message: "과거 시간은 선택할 수 없습니다.", path: ["startTime"] },
  );

export const step2Schema = z.object({
  petIds: z.array(z.string()).min(1, "반려동물을 최소 1마리 이상 선택해주세요."),
  selectedService: z.string().min(1, "서비스를 선택해주세요."),
});

export const step3Schema = z.object({
  note: z.string().max(500, "500자 이하로 입력해주세요."),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
