import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServiceClient } from "@/utils/supabase/service";

function verifySignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
): boolean {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) return false;

  const signedContent = `${webhookId}\n${webhookTimestamp}\n${body}`;
  const computed = createHmac("sha256", Buffer.from(secret, "base64"))
    .update(signedContent)
    .digest("base64");

  return webhookSignature.split(" ").some((sig) => {
    const [version, value] = sig.split(",");
    return version === "v1" && value === computed;
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const webhookId = request.headers.get("portone-webhook-id") ?? "";
  const webhookTimestamp =
    request.headers.get("portone-webhook-timestamp") ?? "";
  const webhookSignature =
    request.headers.get("portone-webhook-signature") ?? "";

  if (!verifySignature(body, webhookId, webhookTimestamp, webhookSignature)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "잘못된 웹훅 서명입니다." } },
      { status: 401 },
    );
  }

  let event: { type: string; data: { paymentId: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json(
      {
        error: { code: "VALIDATION_ERROR", message: "잘못된 요청 형식입니다." },
      },
      { status: 400 },
    );
  }

  const { type, data } = event;
  const { paymentId } = data;

  const db = createServiceClient();

  const { data: payment } = await db
    .from("payments")
    .select("id, reservation_id, amount")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ data: { ok: true } });
  }

  const now = new Date().toISOString();

  if (type === "Transaction.Paid") {
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
      console.error("PortOne 결제 조회 실패", {
        paymentId,
        status: portoneRes.status,
      });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "결제 정보 조회 실패" } },
        { status: 500 },
      );
    }

    const portonePayment = await portoneRes.json();
    const paidAmount: number = portonePayment?.amount?.total;

    if (paidAmount !== payment.amount) {
      console.error("결제 금액 불일치", {
        paymentId,
        paidAmount,
        expected: payment.amount,
      });
      return NextResponse.json(
        { error: { code: "AMOUNT_MISMATCH", message: "결제 금액 불일치" } },
        { status: 400 },
      );
    }

    const { data: reservation } = await db
      .from("reservations")
      .select("status")
      .eq("id", payment.reservation_id)
      .single();

    await db
      .from("payments")
      .update({ status: "paid", paid_at: now })
      .eq("id", payment.id);

    await db
      .from("extra_charges")
      .update({ status: "paid" })
      .eq("payment_id", paymentId);

    const { data: paidPayments } = await db
      .from("payments")
      .select("amount")
      .eq("reservation_id", payment.reservation_id)
      .eq("status", "paid");

    const totalPrice = (paidPayments ?? []).reduce((sum, p) => sum + p.amount, 0);

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
  } else if (type === "Transaction.Cancelled") {
    await Promise.all([
      db
        .from("payments")
        .update({ status: "canceled", canceled_at: now })
        .eq("id", payment.id),
      db
        .from("reservations")
        .update({ status: "canceled", canceled_at: now })
        .eq("id", payment.reservation_id),
      db
        .from("extra_charges")
        .update({ status: "canceled" })
        .eq("payment_id", paymentId),
    ]);
  } else if (type === "Transaction.Failed") {
    await Promise.all([
      db.from("payments").update({ status: "failed" }).eq("id", payment.id),
      db
        .from("extra_charges")
        .update({ status: "rejected" })
        .eq("payment_id", paymentId),
    ]);
  }

  return NextResponse.json({ data: { ok: true } });
}
