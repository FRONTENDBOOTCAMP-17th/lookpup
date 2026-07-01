import { z } from "zod";

export const COMMON_NOTES = ["알러지 있음", "약 복용 중", "사람 경계", "다른 동물 경계", "분리불안"];

const baseSchema = z.object({
  petType: z.enum(["dog", "cat"]).nullable(),
  photoFile: z.instanceof(File).nullable(),
  name: z
    .string()
    .min(1, "이름을 입력해주세요.")
    .max(20, "이름은 20자 이하로 입력해주세요."),
  breed: z.string().max(50, "품종은 50자 이하로 입력해주세요."),
  age: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 240),
      "나이를 올바르게 입력해주세요.",
    ),
  weight: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+(\.\d+)?$/.test(v) && Number(v) <= 100),
      "체중을 올바르게 입력해주세요.",
    ),
  gender: z.enum(["male", "female"]).nullable(),
  neutered: z.boolean(),
  notes: z.string().max(500, "특이사항은 500자 이하로 입력해주세요."),
});

export const petRegisterSchema = baseSchema.superRefine((data, ctx) => {
  if (data.petType === null) {
    ctx.addIssue({ code: "custom", message: "동물 종류를 선택해주세요.", path: ["petType"] });
  }
  if (data.gender === null) {
    ctx.addIssue({ code: "custom", message: "성별을 선택해주세요.", path: ["gender"] });
  }
});
