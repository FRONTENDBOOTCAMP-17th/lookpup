"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function updateProfile(profileImage: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("users")
    .update({ profile_image: profileImage })
    .eq("id", user.id)
    .is("deleted_at", null)
    .select("id, email, full_name, profile_image, role, is_verified, created_at")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function deleteUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: activeReservations } = await db
    .from("reservations")
    .select("id")
    .eq("owner_id", user.id)
    .in("status", ["paid", "in_progress"])
    .limit(1);

  if (activeReservations && activeReservations.length > 0) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "진행 중인 예약이 있어 탈퇴할 수 없습니다.",
      },
    };
  }

  const now = new Date().toISOString();

  const { error } = await db
    .from("users")
    .update({ deleted_at: now })
    .eq("id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { deleted_at: now } };
}
