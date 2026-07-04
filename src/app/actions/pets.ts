"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface PetInput {
  name: string;
  animal_type: "dog" | "cat";
  breed?: string | null;
  age: number;
  gender: "MALE" | "FEMALE" | "MALE_NEUTERED" | "FEMALE_NEUTERED";
  weight: number;
  image_url?: string | null;
  caution?: string | null;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createPet(input: PetInput) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (
    !input.name ||
    input.name.length < 1 ||
    input.name.length > 20 ||
    !["dog", "cat"].includes(input.animal_type) ||
    input.age < 0 ||
    input.age > 240 ||
    input.weight <= 0 ||
    input.weight > 100
  ) {
    return {
      error: { code: "VALIDATION_ERROR", message: "입력값이 유효하지 않습니다." },
    };
  }

  const db = createServiceClient();

  const { count } = await db
    .from("pets")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if (count !== null && count >= 10) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "반려동물은 최대 10마리까지 등록할 수 있습니다.",
      },
    };
  }

  const { data, error } = await db
    .from("pets")
    .insert({ ...input, owner_id: user.id })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function updatePet(id: string, input: Partial<PetInput>) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("pets")
    .select("id, owner_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "반려동물을 찾을 수 없습니다." },
    };
  }

  if (existing.owner_id !== user.id) {
    return {
      error: { code: "FORBIDDEN", message: "수정 권한이 없습니다." },
    };
  }

  const { data, error } = await db
    .from("pets")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function getMyPets() {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, data: [] };

  const db = createServiceClient();
  const { data, error } = await db
    .from("pets")
    .select("id, name, animal_type, breed, age, weight, image_url")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message }, data: [] };
  return { data: data ?? [] };
}

export async function deletePet(id: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: existing } = await db
    .from("pets")
    .select("id, owner_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "반려동물을 찾을 수 없습니다." },
    };
  }

  if (existing.owner_id !== user.id) {
    return {
      error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다." },
    };
  }

  const { data: petReservationLinks } = await db
    .from("reservation_items")
    .select("reservation_id")
    .eq("pet_id", id);

  const linkedReservationIds = (petReservationLinks ?? []).map(
    (item) => item.reservation_id,
  );

  const { data: activeReservations } = linkedReservationIds.length
    ? await db
        .from("reservations")
        .select("id")
        .in("id", linkedReservationIds)
        .in("status", ["paid", "in_progress"])
        .limit(1)
    : { data: [] };

  if (activeReservations && activeReservations.length > 0) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "진행 중인 예약이 있어 삭제할 수 없습니다.",
      },
    };
  }

  await db
    .from("requests")
    .update({ status: "canceled" })
    .eq("pet_id", id)
    .eq("status", "open");

  const now = new Date().toISOString();

  const { error } = await db
    .from("pets")
    .update({ deleted_at: now })
    .eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { deleted_at: now } };
}
