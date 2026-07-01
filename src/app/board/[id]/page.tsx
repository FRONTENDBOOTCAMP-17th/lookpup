import { createServiceClient } from "@/utils/supabase/service";
import BoardDetailClient, {
  type RequestDetail,
  type OtherPost,
} from "@/components/board/BoardDetailClient";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: post } = await db
    .from("requests")
    .select(
      `*, users!owner_id(full_name, profile_image, is_verified, created_at), pets!pet_id(*), applications(*, sitters(id, users!user_id(full_name, profile_image)))`,
    )
    .eq("id", id)
    .single();

  const initialPost = post ? (post as unknown as RequestDetail) : null;

  let initialOtherPosts: OtherPost[] = [];
  if (post?.owner_id) {
    const { data: others } = await db
      .from("requests")
      .select("id, title, location, budget, status, created_at")
      .eq("owner_id", post.owner_id)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(3);
    initialOtherPosts = (others ?? []) as unknown as OtherPost[];
  }

  return (
    <BoardDetailClient
      id={id}
      initialPost={initialPost}
      initialOtherPosts={initialOtherPosts}
    />
  );
}
