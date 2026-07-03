"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface ServiceInput {
  service_type: "walk" | "care" | "hotel" | "pickup";
  title: string;
  price: number;
  description?: string | null;
  animal_type?: string | null;
  is_active?: boolean;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getSitterByUser(userId: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function createService(input: ServiceInput) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (input.price < 1000) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "서비스 가격은 1000원 이상이어야 합니다.",
      },
    };
  }

  const sitter = await getSitterByUser(user.id);

  if (!sitter) {
    return {
      error: { code: "FORBIDDEN", message: "펫시터 프로필이 없습니다." },
    };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("services")
    .insert({ ...input, sitter_id: sitter.id })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const sitter = await getSitterByUser(user.id);

  if (!sitter) {
    return {
      error: { code: "FORBIDDEN", message: "펫시터 프로필이 없습니다." },
    };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("services")
    .select("id, sitter_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "서비스를 찾을 수 없습니다." },
    };
  }

  if (existing.sitter_id !== sitter.id) {
    return {
      error: { code: "FORBIDDEN", message: "수정 권한이 없습니다." },
    };
  }

  if (input.price !== undefined && input.price < 1000) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "서비스 가격은 1000원 이상이어야 합니다.",
      },
    };
  }

  const { data, error } = await db
    .from("services")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function deleteService(id: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const sitter = await getSitterByUser(user.id);

  if (!sitter) {
    return {
      error: { code: "FORBIDDEN", message: "펫시터 프로필이 없습니다." },
    };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("services")
    .select("id, sitter_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "서비스를 찾을 수 없습니다." },
    };
  }

  if (existing.sitter_id !== sitter.id) {
    return {
      error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다." },
    };
  }

  const { data: activeReservations } = await db
    .from("reservations")
    .select("id")
    .eq("service_id", id)
    .in("status", ["paid", "in_progress"])
    .limit(1);

  if (activeReservations && activeReservations.length > 0) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "진행 중인 예약이 있어 삭제할 수 없습니다.",
      },
    };
  }

  const { error } = await db
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}
