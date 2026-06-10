"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function markNotificationRead(id: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: notification } = await db
    .from("notifications")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!notification) {
    return { error: { code: "NOT_FOUND", message: "알림을 찾을 수 없습니다." } };
  }
  if (notification.user_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "권한이 없습니다." } };
  }

  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}

export async function markAllNotificationsRead() {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}
