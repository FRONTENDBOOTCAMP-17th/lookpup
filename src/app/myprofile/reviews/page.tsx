import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import ReviewsClient from "@/components/myprofile/ReviewsClient";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return <ReviewsClient />;

  const db = createServiceClient();

  const [{ data: sitterProfile }, { data: writtenData }] = await Promise.all([
    db.from("sitters").select("id").eq("user_id", authUser.id).maybeSingle(),
    db
      .from("reviews")
      .select(
        `id, rating, content, image_urls, tags, detail_ratings, created_at,
         sitters(users(full_name, profile_image))`,
      )
      .eq("owner_id", authUser.id)
      .order("created_at", { ascending: false }),
  ]);

  const initialWrittenReviews = (writtenData ?? []).map((item) => ({
    id: item.id,
    rating: item.rating,
    content: item.content,
    image_urls: (item.image_urls as string[]) ?? [],
    tags: (item.tags as string[]) ?? [],
    detail_ratings: (item.detail_ratings as Record<string, number>) ?? {},
    created_at: item.created_at ?? "",
    sitter_full_name:
      (item.sitters as { users: { full_name: string } | null } | null)?.users?.full_name ??
      "알 수 없음",
    sitter_profile_image:
      (item.sitters as { users: { profile_image: string | null } | null } | null)?.users
        ?.profile_image ?? null,
  }));

  return (
    <ReviewsClient
      initialSitterId={sitterProfile?.id ?? null}
      initialWrittenReviews={initialWrittenReviews}
    />
  );
}
