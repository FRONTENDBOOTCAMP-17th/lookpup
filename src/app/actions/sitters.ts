"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface ServiceInput {
  service_type: "walk" | "care" | "hotel" | "pickup";
  title: string;
  price: number;
  description?: string | null;
}

interface SitterInput {
  title?: string | null;
  introduction: string;
  career?: string | null;
  available_area: string;
  latitude: number;
  longitude: number;
  base_price: number;
  services: ServiceInput[];
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createSitter(input: SitterInput) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (
    !input.introduction ||
    input.introduction.length < 20 ||
    input.introduction.length > 1000
  ) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "소개글은 20자 이상 1000자 이하여야 합니다.",
      },
    };
  }

  if (input.base_price < 0) {
    return {
      error: { code: "VALIDATION_ERROR", message: "기본 가격은 0 이상이어야 합니다." },
    };
  }

  if (
    !input.services ||
    input.services.some((s) => s.price < 1000)
  ) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "서비스 가격은 1000원 이상이어야 합니다.",
      },
    };
  }

  const db = createServiceClient();

  const { data: userRow } = await db
    .from("users")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (!userRow?.is_verified) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "본인인증 후 펫시터 등록이 가능합니다.",
      },
    };
  }

  const { data: existing } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      error: {
        code: "CONFLICT",
        message: "이미 펫시터 프로필이 존재합니다.",
      },
    };
  }

  const { services, ...sitterFields } = input;

  const { data: sitter, error: sitterError } = await db
    .from("sitters")
    .insert({ ...sitterFields, user_id: user.id })
    .select()
    .single();

  if (sitterError || !sitter) {
    return { error: { code: "INTERNAL_ERROR", message: sitterError?.message ?? "오류가 발생했습니다." } };
  }

  if (services.length > 0) {
    const { error: servicesError } = await db.from("services").insert(
      services.map((s) => ({ ...s, sitter_id: sitter.id })),
    );

    if (servicesError) {
      await db.from("sitters").delete().eq("id", sitter.id);
      return { error: { code: "INTERNAL_ERROR", message: servicesError.message } };
    }
  }

  return { data: sitter };
}

export async function updateSitter(id: string, input: Partial<Omit<SitterInput, "services">>) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("sitters")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "펫시터 프로필을 찾을 수 없습니다." },
    };
  }

  if (existing.user_id !== user.id) {
    return {
      error: { code: "FORBIDDEN", message: "수정 권한이 없습니다." },
    };
  }

  if (
    input.introduction !== undefined &&
    (input.introduction.length < 20 || input.introduction.length > 1000)
  ) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "소개글은 20자 이상 1000자 이하여야 합니다.",
      },
    };
  }

  const { data, error } = await db
    .from("sitters")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}
