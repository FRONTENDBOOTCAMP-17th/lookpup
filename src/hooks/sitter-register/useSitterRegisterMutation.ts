"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createSitter } from "@/app/actions/sitters";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { SERVICES } from "@/lib/sitterRegister";
import type {
  SitterRegisterFormValues,
} from "@/types/sitterRegister";

const DEFAULT_SERVICE_PRICE = 10000;

export function useSitterRegisterMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: SitterRegisterFormValues) => {
      const profilePhotoUrl = values.profilePhotoFile
        ? await uploadToCloudinary(values.profilePhotoFile, "sitters/avatars")
        : undefined;

      const certificateUrls = await Promise.all(
        values.certificateFiles.map((f) =>
          uploadToCloudinary(f, "sitters/certificates"),
        ),
      );

      const activityPhotoUrls = await Promise.all(
        values.activityPhotoFiles.map((f) =>
          uploadToCloudinary(f, "sitters/activity-photos"),
        ),
      );

      const result = await createSitter({
        introduction: values.introduction,
        career: values.career || null,
        available_area: values.location?.address ?? "",
        display_area: values.location?.displayArea ?? null,
        latitude: values.location?.lat ?? 0,
        longitude: values.location?.lng ?? 0,
        base_price: 0,
        request_type: values.selectedServices,
        available_animals: values.selectedAnimals,
        certificate_urls: certificateUrls,
        activity_photo_urls: activityPhotoUrls,
        profile_photo_url: profilePhotoUrl,
        services: values.selectedServices.map((id) => ({
          service_type: id,
          title: SERVICES.find((s) => s.id === id)?.title ?? id,
          price: DEFAULT_SERVICE_PRICE,
        })),
      });

      if ("error" in result) {
        throw new Error(result.error?.message ?? "오류가 발생했습니다.");
      }

      return result.data;
    },
    onSuccess: () => {
      router.push("/myprofile");
    },
  });
}
