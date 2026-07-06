"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

const FEE_RATE = 0.05;

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getActiveReservationBySitter(sitterId: string) {
  const user = await getAuthUser();
  if (!user) return null;

  const db = createServiceClient();

  const { data } = await db
    .from("reservations")
    .select("id")
    .eq("owner_id", user.id)
    .eq("sitter_id", sitterId)
    .in("status", ["accepted", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function createPayment(
  reservationId: string,
  payMethod: "CARD" | "VIRTUAL_ACCOUNT" | "TRANSFER",
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select(
      `id, owner_id, sitter_id, total_price, status,
       sitters!inner(users!inner(full_name))`,
    )
    .eq("id", reservationId)
    .single();

  if (!reservation) {
    return {
      error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." },
    };
  }

  if (reservation.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "결제 권한이 없습니다." } };
  }

  if (reservation.status !== "accepted") {
    return {
      error: {
        code: "FORBIDDEN",
        message: "수락된 예약만 결제할 수 있습니다.",
      },
    };
  }

  const { data: existingPayment } = await db
    .from("payments")
    .select("id")
    .eq("reservation_id", reservationId)
    .eq("status", "paid")
    .maybeSingle();

  if (existingPayment) {
    return { error: { code: "CONFLICT", message: "이미 결제된 예약입니다." } };
  }

  const amount = reservation.total_price;
  const platformFee = Math.floor(amount * FEE_RATE);
  const settleAmount = amount - platformFee;
  const paymentId = `pay_${reservationId.replace(/-/g, "")}_${Date.now()}`;

  const { error } = await db.from("payments").insert({
    reservation_id: reservationId,
    payment_id: paymentId,
    owner_id: user.id,
    sitter_id: (reservation as unknown as { sitter_id: string }).sitter_id,
    amount,
    pay_method: payMethod,
    fee_rate: FEE_RATE,
    platform_fee: platformFee,
    settle_amount: settleAmount,
    status: "ready",
  });

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  const sitter = reservation.sitters as unknown as {
    users: { full_name: string };
  };
  const orderName = `${sitter.users.full_name} 펫시팅 서비스`;

  return { data: { payment_id: paymentId, amount, order_name: orderName } };
}

export async function createExtraPayment(
  reservationId: string,
  amount: number,
  reason: string,
  payMethod: "CARD" | "VIRTUAL_ACCOUNT" | "TRANSFER" = "CARD",
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (amount < 1000 || amount > 500000) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "추가금은 1,000원 이상 500,000원 이하여야 합니다.",
      },
    };
  }

  const db = createServiceClient();

  const { data: reservation } = await db
    .from("reservations")
    .select(`id, owner_id, sitter_id, status, sitters!inner(users!inner(full_name))`)
    .eq("id", reservationId)
    .single();

  if (!reservation) {
    return {
      error: { code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." },
    };
  }

  if (reservation.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "결제 권한이 없습니다." } };
  }

  if (!["in_progress", "paid"].includes(reservation.status)) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "진행 중인 예약에만 추가금을 결제할 수 있습니다.",
      },
    };
  }

  const platformFee = Math.floor(amount * FEE_RATE);
  const settleAmount = amount - platformFee;
  const paymentId = `extra_${reservationId.replace(/-/g, "")}_${Date.now()}`;

  const { data: newPayment, error } = await db.from("payments").insert({
    reservation_id: reservationId,
    payment_id: paymentId,
    owner_id: user.id,
    sitter_id: (reservation as unknown as { sitter_id: string }).sitter_id,
    amount,
    pay_method: payMethod,
    fee_rate: FEE_RATE,
    platform_fee: platformFee,
    settle_amount: settleAmount,
    status: "ready",
  }).select("id").single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  const { data: pendingCharge } = await db
    .from("extra_charges")
    .select("id")
    .eq("reservation_id", reservationId)
    .eq("status", "pending")
    .eq("amount", amount)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingCharge) {
    await db
      .from("extra_charges")
      .update({
        status: "approved",
        payment_id: newPayment.id,
        responded_at: new Date().toISOString(),
      })
      .eq("id", pendingCharge.id);
  }

  const sitter = reservation.sitters as unknown as {
    users: { full_name: string };
  };
  const orderName = `${sitter.users.full_name} 펫시팅 추가 서비스`;

  return {
    data: { payment_id: paymentId, amount, order_name: orderName, reason },
  };
}

export async function verifyAndConfirmPayment(paymentId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: payment } = await db
    .from("payments")
    .select("id, reservation_id, amount, status")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (!payment) {
    return { error: { code: "NOT_FOUND", message: "결제 정보를 찾을 수 없습니다." } };
  }

  if (payment.status === "paid") {
    return { data: { ok: true } };
  }

  const portoneRes = await fetch(
    `https://api.portone.io/payments/${paymentId}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
      },
      cache: "no-store",
    },
  );

  if (!portoneRes.ok) {
    return { error: { code: "INTERNAL_ERROR", message: "PortOne 결제 조회 실패" } };
  }

  const portonePayment = await portoneRes.json();
  const paidAmount: number = portonePayment?.amount?.total;

  if (paidAmount !== payment.amount) {
    return { error: { code: "AMOUNT_MISMATCH", message: "결제 금액이 일치하지 않습니다." } };
  }

  const now = new Date().toISOString();

  await db
    .from("payments")
    .update({ status: "paid", paid_at: now })
    .eq("id", payment.id);

  const { data: paidPayments } = await db
    .from("payments")
    .select("amount")
    .eq("reservation_id", payment.reservation_id)
    .eq("status", "paid");

  const totalPrice = (paidPayments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const { data: reservation } = await db
    .from("reservations")
    .select("status")
    .eq("id", payment.reservation_id)
    .single();

  if (reservation?.status === "accepted") {
    await db
      .from("reservations")
      .update({ status: "paid", paid_at: now, total_price: totalPrice })
      .eq("id", payment.reservation_id);
  } else {
    await db
      .from("reservations")
      .update({ total_price: totalPrice })
      .eq("id", payment.reservation_id);
  }

  return { data: { ok: true } };
}

export async function cancelPayment(paymentId: string, reason: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: payment } = await db
    .from("payments")
    .select(
      `id, payment_id, amount, status,
       reservations!inner(id, owner_id, start_datetime, status)`,
    )
    .eq("payment_id", paymentId)
    .single();

  if (!payment) {
    return {
      error: { code: "NOT_FOUND", message: "결제 정보를 찾을 수 없습니다." },
    };
  }

  const reservation = payment.reservations as unknown as {
    id: string;
    owner_id: string;
    start_datetime: string;
    status: string;
  };

  if (reservation.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "취소 권한이 없습니다." } };
  }

  if (payment.status !== "paid") {
    return {
      error: {
        code: "FORBIDDEN",
        message: "결제 완료 상태만 취소할 수 있습니다.",
      },
    };
  }

  if (new Date(reservation.start_datetime) <= new Date()) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "서비스 시작 후에는 취소할 수 없습니다.",
      },
    };
  }

  // PortOne V2 전액 취소 요청
  const portoneRes = await fetch(
    `https://api.portone.io/payments/${paymentId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      cache: "no-store",
    },
  );

  if (!portoneRes.ok) {
    const errorBody = await portoneRes.json().catch(() => ({}));
    return {
      error: {
        code: "INTERNAL_ERROR",
        message:
          (errorBody as { message?: string }).message ??
          "결제 취소 요청에 실패했습니다.",
      },
    };
  }

  const now = new Date().toISOString();

  await Promise.all([
    db
      .from("payments")
      .update({ status: "canceled", canceled_at: now })
      .eq("payment_id", paymentId),
    db
      .from("reservations")
      .update({ status: "canceled", canceled_at: now })
      .eq("id", reservation.id),
  ]);

  return { data: { canceled_amount: payment.amount } };
}
