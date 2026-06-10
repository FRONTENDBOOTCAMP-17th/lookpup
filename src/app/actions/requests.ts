"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface RequestInput {
  pet_id: string;
  title: string;
  content?: string | null;
  request_type: "walk" | "care" | "hotel" | "pickup";
  start_datetime: string;
  end_datetime: string;
  budget: number;
  location: string;
  latitude: number;
  longitude: number;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createRequest(input: RequestInput) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const now = new Date();
  if (new Date(input.start_datetime) <= now) {
    return { error: { code: "VALIDATION_ERROR", message: "시작일은 오늘 이후여야 합니다." } };
  }
  if (new Date(input.end_datetime) <= new Date(input.start_datetime)) {
    return { error: { code: "VALIDATION_ERROR", message: "종료일은 시작일 이후여야 합니다." } };
  }
  if (input.budget <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "예산은 0보다 커야 합니다." } };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("requests")
    .insert({ ...input, owner_id: user.id, status: "open" })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function updateRequest(
  id: string,
  input: Partial<Omit<RequestInput, "pet_id">> & { status?: string },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("requests")
    .select("id, owner_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." } };
  }

  if (existing.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "수정 권한이 없습니다." } };
  }

  if (existing.status === "matched") {
    return { error: { code: "FORBIDDEN", message: "매칭 이후에는 수정할 수 없습니다." } };
  }

  const { data, error } = await db
    .from("requests")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function deleteRequest(id: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("requests")
    .select("id, owner_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." } };
  }

  if (existing.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다." } };
  }

  if (existing.status !== "open") {
    return { error: { code: "FORBIDDEN", message: "open 상태인 구인글만 삭제할 수 있습니다." } };
  }

  const { error } = await db.from("requests").delete().eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}
