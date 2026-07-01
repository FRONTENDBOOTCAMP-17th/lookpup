import type { z } from "zod";
import type { petRegisterSchema } from "@/schemas/petRegister";

export type PetType = "dog" | "cat";
export type PetGender = "male" | "female";

export type PetRegisterFormValues = z.infer<typeof petRegisterSchema>;
