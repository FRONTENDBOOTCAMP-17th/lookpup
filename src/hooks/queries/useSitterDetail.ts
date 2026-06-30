import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ServiceRow {
  service_type: string;
  title: string | null;
  description: string | null;
  price: number;
  animal_type: string | null;
}

export interface SitterDetail {
  id: string;
  user_id: string;
  full_name: string | null;
  profile_image: string | null;
  is_verified: boolean;
  introduction: string | null;
  career: string | null;
  available_area: string | null;
  display_area: string | null;
  latitude: number | null;
  longitude: number | null;
  base_price: number | null;
  rating: number;
  review_count: number;
  activity_photo_urls: string[];
  services: ServiceRow[];
}

export function useSitterDetail(sitterId: string) {
  return useQuery({
    queryKey: ["sitter", sitterId] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_petsitter_detail", {
        p_sitter_id: sitterId,
      });
      if (error) throw error;
      return data as unknown as SitterDetail;
    },
    enabled: !!sitterId,
  });
}
