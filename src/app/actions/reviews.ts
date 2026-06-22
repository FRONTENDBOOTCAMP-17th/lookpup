"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function recalculateSitterRating(sitterId: string) {
  const db = createServiceClient();
  const { data: rows } = await db
    .from("reviews")
    .select("rating")
    .eq("sitter_id", sitterId);

  const avg =
    rows && rows.length > 0
      ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
      : 0;

  await db
    .from("sitters")
    .update({ rating: parseFloat(avg.toFixed(1)) })
    .eq("id", sitterId);
}

export async function createReview(input: {
  reservation_id: string;
  rating: number;
  content: string;
  image_urls?: string[];
}) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    return { error: { code: "VALIDATION_ERROR", message: "평점은 1~5 정수여야 합니다." } };
  }
  if (!input.content || input.content.length < 10 || input.content.length > 1000) {
    return {
      error: { code: "VALIDATION_ERROR", message: "후기는 10자 이상 1000자 이하여야 합니다." },
    };
  }

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select("id, owner_id, sitter_id, status, completed_at")
    .eq("id", input.reservation_id)
    .single();

  if (!reservation) {
    return { error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };
  }
  if (reservation.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "예약자만 후기를 작성할 수 있습니다." } };
  }
  if (reservation.status !== "completed") {
    return { error: { code: "FORBIDDEN", message: "완료된 예약에만 후기를 작성할 수 있습니다." } };
  }
  if (reservation.completed_at) {
    const days =
      (Date.now() - new Date(reservation.completed_at).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 7) {
      return {
        error: { code: "FORBIDDEN", message: "완료 후 7일 이내에만 후기를 작성할 수 있습니다." },
      };
    }
  }

  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("reservation_id", input.reservation_id)
    .maybeSingle();

  if (existing) {
    return { error: { code: "CONFLICT", message: "이미 후기를 작성했습니다." } };
  }

  const { data: review, error } = await db
    .from("reviews")
    .insert({
      reservation_id: input.reservation_id,
      owner_id: user.id,
      sitter_id: reservation.sitter_id,
      rating: input.rating,
      content: input.content,
      image_urls: input.image_urls ?? [],
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await recalculateSitterRating(reservation.sitter_id);

  return { data: review };
}

export async function deleteReview(id: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: review } = await db
    .from("reviews")
    .select("id, owner_id, sitter_id")
    .eq("id", id)
    .single();

  if (!review) {
    return { error: { code: "NOT_FOUND", message: "후기를 찾을 수 없습니다." } };
  }

  const { data: userRow } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (review.owner_id !== user.id && userRow?.role !== "admin") {
    return { error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다." } };
  }

  const { error } = await db.from("reviews").delete().eq("id", id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await recalculateSitterRating(review.sitter_id);

  return { data: { ok: true } };
}
