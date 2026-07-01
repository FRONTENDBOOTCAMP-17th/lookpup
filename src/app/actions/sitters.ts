"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface ServiceInput {
  service_type: "walk" | "care" | "hotel" | "pickup";
  title: string;
  price: number;
  description?: string | null;
}

type RequestType = "visit" | "foster" | "walk" | "hotel";
type AnimalType = "small_dog" | "medium_dog" | "large_dog" | "cat";

interface SitterInput {
  title?: string | null;
  introduction: string;
  career?: string | null;
  available_area: string;
  display_area?: string | null;
  latitude: number;
  longitude: number;
  base_price: number;
  request_type?: RequestType[];
  available_animals?: AnimalType[];
  certificate_urls?: string[];
  activity_photo_urls?: string[];
  profile_photo_url?: string;
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

  if (input.services && input.services.some((s) => s.price < 1000)) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "서비스 가격은 1000원 이상이어야 합니다.",
      },
    };
  }

  const validRequestTypes: RequestType[] = ["visit", "foster", "walk", "hotel"];
  if (
    input.request_type &&
    input.request_type.some((t) => !validRequestTypes.includes(t))
  ) {
    return {
      error: { code: "VALIDATION_ERROR", message: "유효하지 않은 서비스 유형입니다." },
    };
  }

  const validAnimalTypes: AnimalType[] = ["small_dog", "medium_dog", "large_dog", "cat"];
  if (
    input.available_animals &&
    input.available_animals.some((a) => !validAnimalTypes.includes(a))
  ) {
    return {
      error: { code: "VALIDATION_ERROR", message: "유효하지 않은 동물 유형입니다." },
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

  const { services, profile_photo_url, ...sitterFields } = input;

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

  // 프로필 사진 및 role 업데이트
  const userUpdates: Record<string, unknown> = { role: "both" };
  if (profile_photo_url) userUpdates.profile_image = profile_photo_url;
  await db.from("users").update(userUpdates).eq("id", user.id);

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

export async function getMySitterProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("sitters")
    .select("id, available_area, display_area, career, introduction, rating, latitude, longitude, request_type, available_animals, activity_photo_urls, services(title, is_active)")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return { error: { code: "NOT_FOUND", message: "시터 프로필이 없습니다." } };
  }

  const { count: reviewCount } = await db
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("sitter_id", data.id);

  return {
    data: {
      id: data.id,
      availableArea: data.available_area ?? "",
      displayArea: (data as any).display_area ?? null,
      career: data.career ?? null,
      introduction: data.introduction ?? null,
      rating: data.rating ?? 0,
      services: (data.services as { title: string; is_active: boolean }[])
        .filter((s) => s.is_active)
        .map((s) => s.title),
      reviewCount: reviewCount ?? 0,
      requestType: (data.request_type as string[]) ?? [],
      availableAnimals: (data.available_animals as string[]) ?? [],
      activityPhotoUrls: (data.activity_photo_urls as string[]) ?? [],
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  };
}

interface UpdateSitterProfileInput {
  availableArea: string;
  displayArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  introduction: string;
  career: string;
  availableAnimals: string[];
  activityPhotoUrls: string[];
  services: {
    id?: string;
    title: string;
    price: number;
    description: string;
  }[];
  deletedServiceIds: string[];
}

export async function updateSitterProfile(input: UpdateSitterProfileInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: sitter, error: sitterFetchError } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (sitterFetchError || !sitter) {
    return { error: { code: "NOT_FOUND", message: "시터 프로필을 찾을 수 없습니다." } };
  }

  const updatePayload: Record<string, unknown> = {
    available_area: input.availableArea,
    introduction: input.introduction,
    career: input.career,
    available_animals: input.availableAnimals,
    activity_photo_urls: input.activityPhotoUrls,
  };
  if (input.displayArea != null) updatePayload.display_area = input.displayArea;
  if (input.latitude != null) updatePayload.latitude = input.latitude;
  if (input.longitude != null) updatePayload.longitude = input.longitude;

  const { error: updateError } = await db
    .from("sitters")
    .update(updatePayload)
    .eq("id", sitter.id);

  if (updateError) {
    return { error: { code: "INTERNAL_ERROR", message: updateError.message } };
  }

  if (input.deletedServiceIds.length > 0) {
    await db
      .from("services")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", input.deletedServiceIds);
  }

  for (const service of input.services) {
    if (service.id) {
      await db.from("services").update({
        title: service.title,
        price: service.price,
        description: service.description,
      }).eq("id", service.id);
    } else {
      await db.from("services").insert({
        sitter_id: sitter.id,
        service_type: service.title,
        title: service.title,
        price: service.price,
        description: service.description,
        is_active: true,
      });
    }
  }

  return { data: { updated: true } };
}

export async function getSitterById(id: string) {
  const db = createServiceClient();
  const { data: sitter, error } = await db
    .from("sitters")
    .select(`
      id, base_price,
      users!inner(full_name),
      services(id, service_type, title, price, is_active)
    `)
    .eq("id", id)
    .single();

  if (error || !sitter) return { error: { code: "NOT_FOUND", message: "펫시터를 찾을 수 없습니다." } };

  const services = sitter.services ?? [];

  return {
    data: {
      full_name: sitter.users.full_name,
      base_price: sitter.base_price,
      services,
    },
  };
}

export async function getSitterServices(sitterId: string) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("services")
    .select("id, title, price, description, is_active")
    .eq("sitter_id", sitterId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return { data: [] };
  return { data: data ?? [] };
}
