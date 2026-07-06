import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

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
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, content, image_urls, tags, created_at, owner_id")
        .eq("sitter_id", sitterId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = data ?? [];
      const ownerIds = [...new Set(rows.map((rv) => rv.owner_id))];
      const profileMap = new Map<
        string,
        { full_name: string | null; profile_image: string | null }
      >();

      if (ownerIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase.rpc(
          "get_public_user_profiles",
          { user_ids: ownerIds },
        );
        if (profileError) throw profileError;
        for (const profile of profiles ?? []) {
          profileMap.set(profile.id, {
            full_name: profile.full_name,
            profile_image: profile.profile_image,
          });
        }
      }

      return rows.map((rv) => ({
        ...rv,
        owner: profileMap.get(rv.owner_id) ?? null,
      })) as ReviewRow[];
    },
    enabled: !!sitterId,
  });
}
