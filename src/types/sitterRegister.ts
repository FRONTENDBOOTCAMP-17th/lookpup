import type { z } from "zod";
import type { sitterRegisterSchema } from "@/schemas/sitterRegister";

export type SitterServiceId = "visit" | "foster" | "walk" | "hotel";
export type SitterAnimalId = "small_dog" | "medium_dog" | "large_dog" | "cat";

export type SitterRegisterFormValues = z.infer<typeof sitterRegisterSchema>;

export interface SitterRegisterSubmitPayload {
  introduction: string;
  career: string | null;
  available_area: string;
  display_area: string | null;
  latitude: number;
  longitude: number;
  base_price: number;
  request_type: SitterServiceId[];
  available_animals: SitterAnimalId[];
  certificate_urls: string[];
  activity_photo_urls: string[];
  profile_photo_url?: string;
  services: never[];
}
