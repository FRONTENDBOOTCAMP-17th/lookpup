"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface RequestInput {
  pet_ids: string[];
  title: string;
  content?: string | null;
  request_type: "walk" | "care" | "hotel" | "pickup" | "foster" | "other";
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

// ⚠️ 임시 우회 (2026-06-17): pets/getMyPets와 동일한 이유 — requests 테이블에
// SELECT RLS 정책이 없어 클라이언트(anon key) 직접 조회가 빈 배열만 반환됨.
// service client로 우회. RLS 정책(예: "open 상태는 누구나 조회 가능") 추가되면
// 이 함수는 지우고 호출부(board/page.tsx)에서 다시 클라이언트 직접 조회로 되돌릴 것.
export async function listOpenRequests() {
  const db = createServiceClient();

  const { data, error } = await db
    .from("requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

// ⚠️ 임시 우회 (2026-06-17): listOpenRequests와 동일한 이유 — requests 직접 조회 RLS 우회.
// request_pets 테이블이 없어서 pets!pet_id(*)로 단일 FK 조인.
export async function getRequestDetail(id: string) {
  const db = createServiceClient();

  const { data, error } = await db
    .from("requests")
    .select(
      `*, users!owner_id(full_name, profile_image, is_verified), pets!pet_id(*), applications(*, sitters(id, users!user_id(full_name, profile_image)))`,
    )
    .eq("id", id)
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

// ⚠️ 임시 우회 (2026-06-17): getMyPets와 동일한 이유 — requests 직접 조회 RLS 우회.
// request_pets 테이블이 없어서 pets!pet_id(...)로 단일 FK 조인.
export async function getMyRequests() {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("requests")
    .select(
      `*, pets!pet_id(name, animal_type), applications(status, sitters(users!user_id(full_name))), reservations(status)`,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function createRequest(input: RequestInput) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!input.pet_ids || input.pet_ids.length === 0) {
    return { error: { code: "VALIDATION_ERROR", message: "반려동물을 선택해주세요." } };
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

  const { pet_ids, ...requestFields } = input;

  // ⚠️ DB에 request_pets(다대다 조인) 테이블이 없음 — requests.pet_id가 단일 컬럼임
  // (lookpup.sql 설계 문서 확인, 2026-06-17). 그래서 여러 마리 선택해도 첫 번째 펫만 저장됨.
  // 여러 마리 동시 연결을 지원하려면 DB에 request_pets 테이블 추가 필요 (팀 협의 필요).
  const { data, error } = await db
    .from("requests")
    .insert({
      ...requestFields,
      id: crypto.randomUUID(),
      pet_id: pet_ids[0],
      owner_id: user.id,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function updateRequest(
  id: string,
  input: Partial<Omit<RequestInput, "pet_ids">> & { status?: string; pet_ids?: string[] },
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

  const { pet_ids, ...requestFields } = input;

  // ⚠️ createRequest와 동일한 이유로 request_pets 대신 requests.pet_id 단일 컬럼 사용
  const { data, error } = await db
    .from("requests")
    .update({
      ...requestFields,
      ...(pet_ids ? { pet_id: pet_ids[0] } : {}),
    })
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
