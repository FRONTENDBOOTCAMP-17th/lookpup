"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface LocationConsentResult {
  userId: string | null;
  hasConsent: boolean;
}

export function useLocationConsentQuery() {
  return useQuery({
    queryKey: ["locationConsent"] as const,
    queryFn: async (): Promise<LocationConsentResult> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          userId: null,
          hasConsent: localStorage.getItem("location_consent") === "true",
        };
      }

      const { data } = await supabase
        .from("users")
        .select("location_consent")
        .eq("id", user.id)
        .single();

      return { userId: user.id, hasConsent: !!data?.location_consent };
    },
    staleTime: Infinity,
  });
}
