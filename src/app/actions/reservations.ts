"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

const FEE_RATE = 0.05;


interface BookingReservationInput {
  sitter_id: string;
  service_id: string;
  pet_ids: string[];
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  payment_id: string;
  pay_method: string;
  memo?: string | null;
}

export async function createBookingReservation(input: BookingReservationInput) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!input.pet_ids.length) {
    return { error: { code: "VALIDATION_ERROR", message: "반려동물을 선택해주세요." } };
  }
  if (input.total_price <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "결제 금액이 올바르지 않습니다." } };
  }
  if (new Date(input.start_datetime) >= new Date(input.end_datetime)) {
    return { error: { code: "VALIDATION_ERROR", message: "종료일은 시작일 이후여야 합니다." } };
  }

  const db = createServiceClient();

  const { data: reservation, error: reservationError } = await db
    .from("reservations")
    .insert({
      owner_id: user.id,
      sitter_id: input.sitter_id,
      service_id: input.service_id,
      start_datetime: input.start_datetime,
      end_datetime: input.end_datetime,
      total_price: input.total_price,
      status: "pending",
      memo: input.memo ?? null,
    })
    .select()
    .single();

  if (reservationError) {
    return { error: { code: "INTERNAL_ERROR", message: reservationError.message } };
  }

  const { error: itemsError } = await db
    .from("reservation_items")
    .insert(input.pet_ids.map((pet_id) => ({ reservation_id: reservation.id, pet_id })));

  if (itemsError) {
    await db.from("reservations").delete().eq("id", reservation.id);
    return { error: { code: "INTERNAL_ERROR", message: itemsError.message } };
  }

  const platformFee = Math.floor(input.total_price * FEE_RATE);

  const { error: paymentError } = await db.from("payments").insert({
    id: input.payment_id,
    reservation_id: reservation.id,
    owner_id: user.id,
    sitter_id: input.sitter_id,
    pay_method: input.pay_method,
    amount: input.total_price,
    fee_rate: FEE_RATE,
    platform_fee: platformFee,
    settle_amount: input.total_price - platformFee,
    status: "ready",
  });

  if (paymentError) {
    await db.from("reservation_items").delete().eq("reservation_id", reservation.id);
    await db.from("reservations").delete().eq("id", reservation.id);
    return { error: { code: "INTERNAL_ERROR", message: paymentError.message } };
  }

  return { data: { reservation_id: reservation.id, payment_id: input.payment_id } };
}

interface ReservationInput {
  sitter_id: string;
  service_id: string;
  pet_ids: string[];
  start_datetime: string;
  end_datetime: string;
  memo?: string | null;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createReservation(input: ReservationInput) {
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
  if (input.memo && input.memo.length > 500) {
    return { error: { code: "VALIDATION_ERROR", message: "메모는 500자 이하여야 합니다." } };
  }

  const db = createServiceClient();

  // 서비스 존재 및 해당 시터 소유 확인 + 가격 조회
  const { data: service } = await db
    .from("services")
    .select("id, sitter_id, price, is_active")
    .eq("id", input.service_id)
    .single();

  if (!service) {
    return { error: { code: "NOT_FOUND", message: "서비스를 찾을 수 없습니다." } };
  }
  if (service.sitter_id !== input.sitter_id) {
    return { error: { code: "VALIDATION_ERROR", message: "해당 시터의 서비스가 아닙니다." } };
  }
  if (!service.is_active) {
    return { error: { code: "FORBIDDEN", message: "비활성화된 서비스입니다." } };
  }

  const { data: reservation, error } = await db
    .from("reservations")
    .insert({
      owner_id: user.id,
      sitter_id: input.sitter_id,
      service_id: input.service_id,
      start_datetime: input.start_datetime,
      end_datetime: input.end_datetime,
      total_price: service.price,
      status: "pending",
      memo: input.memo ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  const { error: itemsError } = await db
    .from("reservation_items")
    .insert(input.pet_ids.map((pet_id) => ({ reservation_id: reservation.id, pet_id })));

  if (itemsError) {
    await db.from("reservations").delete().eq("id", reservation.id);
    return { error: { code: "INTERNAL_ERROR", message: itemsError.message } };
  }

  return { data: reservation };
}

type UpdateStatus = "accepted" | "in_progress" | "completed" | "canceled";

const VALID_TRANSITIONS: Record<UpdateStatus, string[]> = {
  accepted: ["pending"],
  in_progress: ["paid"],
  completed: ["in_progress"],
  canceled: ["pending", "accepted", "paid"],
};

export async function updateReservation(
  id: string,
  input: { status: UpdateStatus; cancel_reason?: string | null },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select("id, owner_id, sitter_id, status")
    .eq("id", id)
    .single();

  if (!reservation) {
    return { error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };
  }

  // 현재 상태에서 요청 상태로 전이 가능한지 확인
  if (!VALID_TRANSITIONS[input.status].includes(reservation.status)) {
    return {
      error: {
        code: "FORBIDDEN",
        message: `${reservation.status} 상태에서 ${input.status}로 변경할 수 없습니다.`,
      },
    };
  }

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwner = reservation.owner_id === user.id;
  const isSitter = sitterProfile?.id === reservation.sitter_id;

  if (input.status === "accepted" || input.status === "in_progress" || input.status === "completed") {
    if (!isSitter) {
      return { error: { code: "FORBIDDEN", message: "펫시터만 처리할 수 있습니다." } };
    }
  } else if (input.status === "canceled") {
    if (!isOwner && !isSitter) {
      return { error: { code: "FORBIDDEN", message: "예약 당사자만 취소할 수 있습니다." } };
    }
  }

  const now = new Date().toISOString();
  const timestamps: Record<string, string> = {
    accepted: "accepted_at",
    completed: "completed_at",
    canceled: "canceled_at",
  };

  const updatePayload: Record<string, unknown> = { status: input.status };
  if (timestamps[input.status]) {
    updatePayload[timestamps[input.status]] = now;
  }
  if (input.status === "canceled" && input.cancel_reason) {
    updatePayload.cancel_reason = input.cancel_reason;
  }

  const { data, error } = await db
    .from("reservations")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export const STATUS_MAP: Record<string, string> = {
  pending: "pending",
  accepted: "confirmed",
  paid: "confirmed",
  in_progress: "in-progress",
  completed: "completed",
  canceled: "cancelled",
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export async function getMyReservations() {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, data: [] };

  const db = createServiceClient();

  const { data, error } = await db
    .from("reservations")
    .select(`
      id, status, start_datetime, end_datetime, total_price, created_at,
      services(title),
      sitters(available_area, rating, users(full_name)),
      reservation_items(pets(name, breed, animal_type)),
      reviews(id)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: { code: "INTERNAL_ERROR", message: error.message }, data: [] };

  const pad = (n: number) => String(n).padStart(2, "0");

  const bookings = (data ?? []).map((r) => {
    const start = new Date(r.start_datetime);
    const end = new Date(r.end_datetime);
    const created = new Date(r.created_at ?? "");
    const dateStr = `${created.getFullYear()}${pad(created.getMonth() + 1)}${pad(created.getDate())}`;

    type SitterRow = { available_area: string; rating: number; users: { full_name: string } | null } | null;
    type PetRow = { name: string; breed: string | null; animal_type: string } | null;
    type ItemRow = { pets: PetRow };

    const sitter = r.sitters as SitterRow;
    const service = r.services as { title: string } | null;
    const items = (r.reservation_items as ItemRow[]) ?? [];
    const firstPet = items[0]?.pets;
    const reviews = (r.reviews as { id: string }[]) ?? [];

    return {
      id: r.id,
      bookingNo: `BK-${dateStr}-${r.id.slice(-3).toUpperCase()}`,
      serviceType: service?.title ?? "-",
      status: STATUS_MAP[r.status] ?? "pending",
      sitterName: sitter?.users?.full_name ?? "-",
      sitterRating: sitter?.rating ?? 0,
      date: `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 (${DAYS[start.getDay()]})`,
      time: `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`,
      location: sitter?.available_area ?? "-",
      petName: firstPet?.name ?? "-",
      petType: firstPet?.breed ?? firstPet?.animal_type ?? "-",
      price: r.total_price,
      reviewWritten: reviews.length > 0,
    };
  });

  return { data: bookings };
}

const PET_EMOJI: Record<string, string> = {
  cat: "🐱",
  small_dog: "🐶",
  medium_dog: "🐕",
  large_dog: "🐕",
};
const PET_GRADIENT: Record<string, string> = {
  cat: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg, #FFE4C8, #FFB6A3)";

export async function getReservationById(id: string) {
  const user = await getAuthUser();
  if (!user) return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };

  const db = createServiceClient();

  const { data: r, error } = await db
    .from("reservations")
    .select(`
      id, status, start_datetime, end_datetime, total_price, created_at, sitter_id,
      services(title),
      sitters(available_area, rating, users(full_name, is_verified)),
      reservation_items(pets(name, breed, animal_type, age, weight)),
      reviews(id)
    `)
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error || !r) return { error: { code: "NOT_FOUND", message: "예약 정보를 찾을 수 없습니다." } };

  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(r.start_datetime);
  const end = new Date(r.end_datetime);
  const created = new Date(r.created_at ?? "");
  const dateStr = `${created.getFullYear()}${pad(created.getMonth() + 1)}${pad(created.getDate())}`;

  type SitterRow = { available_area: string; rating: number; users: { full_name: string; is_verified: boolean } | null } | null;
  type PetRow = { name: string; breed: string | null; animal_type: string; age: number | null; weight: number | null } | null;

  const sitter = r.sitters as SitterRow;
  const service = r.services as { title: string } | null;
  const items = (r.reservation_items as { pets: PetRow }[]) ?? [];
  const firstPet = items[0]?.pets;
  const reviews = (r.reviews as { id: string }[]) ?? [];

  const { count: reviewCount } = await db
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("sitter_id", (r as { sitter_id: string }).sitter_id);

  return {
    data: {
      id: r.id,
      bookingNo: `BK-${dateStr}-${r.id.slice(-3).toUpperCase()}`,
      serviceType: service?.title ?? "-",
      status: STATUS_MAP[r.status] ?? "pending",
      sitter: {
        name: sitter?.users?.full_name ?? "-",
        rating: sitter?.rating ?? 0,
        reviewCount: reviewCount ?? 0,
        certified: sitter?.users?.is_verified ?? false,
      },
      date: `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 (${DAYS[start.getDay()]})`,
      time: `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`,
      location: sitter?.available_area ?? "-",
      pet: {
        name: firstPet?.name ?? "-",
        breed: firstPet?.breed ?? firstPet?.animal_type ?? "-",
        age: firstPet?.age ?? 0,
        weight: Number(firstPet?.weight ?? 0),
        emoji: PET_EMOJI[firstPet?.animal_type ?? ""] ?? "🐾",
        gradient: PET_GRADIENT[firstPet?.animal_type ?? ""] ?? DEFAULT_GRADIENT,
      },
      price: r.total_price,
      reviewWritten: reviews.length > 0,
    },
  };
}
