import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import PostsClient from "@/components/myprofile/PostsClient";
import type { RequestRow } from "@/components/myprofile/PostsClient";

export default async function PostsManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <PostsClient />;

  const db = createServiceClient();
  const { data } = await db
    .from("requests")
    .select(
      `*, pets!pet_id(name, animal_type), applications(status, sitters(users!user_id(full_name))), reservations(status)`,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return <PostsClient initialPosts={(data ?? []) as RequestRow[]} />;
}
