"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { fuzzCoordinate } from "@/utils/geoPrivacy";

type SitterCondition =
  | "require_badge"
  | "prefer_female"
  | "require_certificate"
  | "no_smoker";

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
  sitter_conditions?: SitterCondition[];
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// 조회(listOpenRequests/getRequestDetail/getMyRequests)는 팀 컨벤션(API_USAGE.md)에 따라
// API 라우트(GET /api/requests, /api/requests/[id])로 분리됨. 여기엔 쓰기(mutation)만 둔다.

// 조회수 +1. 상세 페이지 진입 시에만 호출 — GET 라우트에 부수효과를 두지 않기 위해 분리.
// 비로그인도 조회수는 오르므로 인증 불필요.
export async function incrementViewCount(id: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("requests")
    .select("view_count")
    .eq("id", id)
    .single();
  if (data) {
    await db
      .from("requests")
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq("id", id);
  }
}

export async function createRequest(input: RequestInput) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!input.pet_ids || input.pet_ids.length === 0) {
    return {
      error: { code: "VALIDATION_ERROR", message: "반려동물을 선택해주세요." },
    };
  }

  const now = new Date();
  if (new Date(input.start_datetime) <= now) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "시작일은 오늘 이후여야 합니다.",
      },
    };
  }
  if (new Date(input.end_datetime) <= new Date(input.start_datetime)) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "종료일은 시작일 이후여야 합니다.",
      },
    };
  }
  if (input.budget < 0) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "예산은 0 이상이어야 합니다.",
      },
    };
  }

  const validConditions: SitterCondition[] = [
    "require_badge",
    "prefer_female",
    "require_certificate",
    "no_smoker",
  ];
  if (input.sitter_conditions?.some((c) => !validConditions.includes(c))) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "유효하지 않은 펫시터 조건입니다.",
      },
    };
  }

  const db = createServiceClient();

  const { pet_ids, ...requestFields } = input;

  // request_pets 테이블이 없어 pet_id 단일 컬럼 — 여러 마리 선택해도 첫 마리만 저장
  const { data, error } = await db
    .from("requests")
    .insert({
      ...requestFields,
      latitude: fuzzCoordinate(requestFields.latitude),
      longitude: fuzzCoordinate(requestFields.longitude),
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
  input: Partial<Omit<RequestInput, "pet_ids">> & {
    status?: string;
    pet_ids?: string[];
  },
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
    return {
      error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." },
    };
  }

  if (existing.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "수정 권한이 없습니다." } };
  }

  if (existing.status === "matched") {
    return {
      error: {
        code: "FORBIDDEN",
        message: "매칭 이후에는 수정할 수 없습니다.",
      },
    };
  }

  const { pet_ids, ...requestFields } = input;

  if (requestFields.latitude != null) requestFields.latitude = fuzzCoordinate(requestFields.latitude);
  if (requestFields.longitude != null) requestFields.longitude = fuzzCoordinate(requestFields.longitude);

  // request_pets 테이블이 없어 pet_id 단일 컬럼 사용
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
    return {
      error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." },
    };
  }

  if (existing.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다." } };
  }

  if (existing.status !== "open") {
    return {
      error: {
        code: "FORBIDDEN",
        message: "open 상태인 구인글만 삭제할 수 있습니다.",
      },
    };
  }

  const { error } = await db.from("requests").delete().eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}
