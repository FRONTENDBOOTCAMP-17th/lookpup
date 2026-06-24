import { createServiceClient } from "@/utils/supabase/service";

export async function createNotification({
  userId,
  type,
  title,
  content,
  linkUrl,
}: {
  userId: string;
  type: string;
  title: string;
  content: string;
  linkUrl?: string;
}) {
  const db = createServiceClient();
  await db.from("notifications").insert({
    user_id: userId,
    type,
    title,
    content,
    link_url: linkUrl ?? null,
  });
}
