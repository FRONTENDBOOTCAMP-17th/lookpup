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
    reservation_id: reservation.id,
    payment_id: input.payment_id,
    amount: input.total_price,
    pay_method: input.pay_method,
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
