"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { LocationConsentResult } from "./useLocationConsentQuery";

export function useGrantLocationConsentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string | null) => {
      if (userId) {
        const supabase = createClient();
        await supabase.from("users").update({ location_consent: true }).eq("id", userId);
      } else {
        localStorage.setItem("location_consent", "true");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<LocationConsentResult>(["locationConsent"], (old) =>
        old ? { ...old, hasConsent: true } : old,
      );
    },
  });
}
