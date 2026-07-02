import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SitterRow {
  id: string;
  user_id?: string | null;
  available_area: string | null;
  display_area: string | null;
  latitude: number | null;
  longitude: number | null;
  base_price: number | null;
  rating: number | null;
  full_name: string | null;
  profile_image: string | null;
  service_types: string[];
}

export interface SitterFilters {
  district: string;
  dong: string;
}

export function useSitters(filters: SitterFilters) {
  return useQuery({
    queryKey: ["sitters", filters] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_petsitters_filtered", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_district: (filters.district || null) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_dong: (filters.dong || null) as any,
      });
      if (error) throw error;
      return (data as SitterRow[]).filter(
        (row) => row.latitude != null && row.longitude != null,
      );
    },
    staleTime: 1000 * 30,
  });
}
