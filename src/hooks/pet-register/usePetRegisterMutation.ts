"use client";

import { useMutation } from "@tanstack/react-query";
import { createPet } from "@/app/actions/pets";
import { uploadToCloudinary } from "@/utils/cloudinary";
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

      const imageUrl = values.photoFile
        ? await uploadToCloudinary(values.photoFile, "pets/photos")
        : null;

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
