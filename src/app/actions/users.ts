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

export async function updateUserInfo(info: {
  fullName: string;
  phoneNumber: string;
  birthdate: string | null;
}) {
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
    .update({
      full_name: info.fullName,
      phone_number: info.phoneNumber,
      birthdate: info.birthdate,
    })
    .eq("id", user.id)
    .is("deleted_at", null)
    .select("id, email, full_name, phone_number, address, birthdate, profile_image, role, is_verified")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function restoreUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: userRow } = await db
    .from("users")
    .select("id, deleted_at")
    .eq("id", user.id)
    .single();

  if (!userRow?.deleted_at) {
    return { error: { code: "BAD_REQUEST", message: "탈퇴된 계정이 아닙니다." } };
  }

  const { error } = await db
    .from("users")
    .update({ deleted_at: null, delete_reason: null, is_verified: false })
    .eq("id", user.id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { restored: true } };
}

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const trimmed = query.trim();
  if (trimmed.length < 1) return { data: [] };

  const db = createServiceClient();

  const { data, error } = await db
    .from("users")
    .select("id, full_name, profile_image, role")
    .ilike("full_name", `%${trimmed}%`)
    .is("deleted_at", null)
    .neq("id", user.id)
    .limit(10);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: data ?? [] };
}

export async function updateOwnerLocation(location: {
  address: string;
  lat: number;
  lng: number;
  dong: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { error } = await db
    .from("users")
    .update({
      latitude: location.lat,
      longitude: location.lng,
      address: location.address,
      display_area: location.dong,
    })
    .eq("id", user.id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { saved: true } };
}

export async function getOwnerLocation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null };

  const db = createServiceClient();

  const { data } = await db
    .from("users")
    .select("latitude, longitude, address, display_area")
    .eq("id", user.id)
    .single();

  if (!data?.latitude || !data?.longitude) return { data: null };

  return {
    data: {
      lat: Number(data.latitude),
      lng: Number(data.longitude),
      address: data.address ?? "",
      dong: data.display_area ?? data.address ?? "",
    },
  };
}

export async function deleteUser(reason?: string) {
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
    .update({ deleted_at: now, delete_reason: reason ?? null, phone_number: null })
    .eq("id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { deleted_at: now } };
}
