"use client";

import { useMutation } from "@tanstack/react-query";
import { createPet, uploadPetPhoto } from "@/app/actions/pets";
import type { PetRegisterFormValues } from "@/types/petRegister";

export function usePetRegisterMutation() {
  return useMutation({
    mutationFn: async (values: PetRegisterFormValues) => {
      const genderValue =
        values.gender === "male"
          ? values.neutered
            ? "MALE_NEUTERED"
            : "MALE"
          : values.neutered
            ? "FEMALE_NEUTERED"
            : "FEMALE";

      // pets.image_url은 컬럼이 1개라 첫 번째 사진만 업로드해서 사용
      let imageUrl: string | null = null;
      if (values.photoFile) {
        const formData = new FormData();
        formData.append("file", values.photoFile);
        const uploadResult = await uploadPetPhoto(formData);
        if (uploadResult.error) {
          throw new Error(uploadResult.error.message);
        }
        imageUrl = uploadResult.data.url;
      }

      const result = await createPet({
        name: values.name.trim(),
        animal_type: values.petType!,
        breed: values.breed.trim() || null,
        age: values.age ? parseInt(values.age) : 0,
        gender: genderValue,
        weight: values.weight ? parseFloat(values.weight) : 0,
        image_url: imageUrl,
        caution: values.notes.trim() || null,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
  });
}
