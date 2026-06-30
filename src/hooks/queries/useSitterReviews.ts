import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ReviewRow {
  id: string;
  rating: number;
  content: string;
  image_urls: string[] | null;
  tags: string[];
  created_at: string;
  owner: {
    full_name: string | null;
    profile_image: string | null;
  } | null;
}

export function useSitterReviews(sitterId: string) {
  return useQuery({
    queryKey: ["sitter-reviews", sitterId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, rating, content, image_urls, tags, created_at, owner:users!reviews_owner_id_fkey(full_name, profile_image)",
        )
        .eq("sitter_id", sitterId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
    enabled: !!sitterId,
  });
}
