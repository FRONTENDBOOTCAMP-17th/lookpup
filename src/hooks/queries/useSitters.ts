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
  service_prices: Record<string, number>;
  review_count: number;
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
      const rows = (data as Omit<SitterRow, "review_count">[]).filter(
        (row) => row.latitude != null && row.longitude != null,
      );

      const sitterIds = rows.map((row) => row.id);
      const reviewCounts = new Map<string, number>();
      if (sitterIds.length > 0) {
        const { data: reviewRows, error: reviewError } = await supabase
          .from("reviews")
          .select("sitter_id")
          .in("sitter_id", sitterIds);
        if (reviewError) throw reviewError;
        for (const { sitter_id } of reviewRows ?? []) {
          reviewCounts.set(sitter_id, (reviewCounts.get(sitter_id) ?? 0) + 1);
        }
      }

      return rows.map((row) => ({
        ...row,
        service_prices: row.service_prices ?? {},
        review_count: reviewCounts.get(row.id) ?? 0,
      }));
    },
    staleTime: 1000 * 30,
  });
}
