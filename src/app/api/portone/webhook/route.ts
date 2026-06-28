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

  // 공백 구분자로 여러 서명 포함 가능 (키 교체 대응)
  return webhookSignature.split(" ").some((sig) => {
    const [version, value] = sig.split(",");
    return version === "v1" && value === computed;
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const webhookId = request.headers.get("portone-webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("portone-webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("portone-webhook-signature") ?? "";

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
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청 형식입니다." } },
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

  // 알 수 없는 결제 ID면 200 반환 (재전송 방지)
  if (!payment) {
    return NextResponse.json({ data: { ok: true } });
  }

  const now = new Date().toISOString();

  if (type === "Transaction.Paid") {
    // PortOne API로 실제 결제 금액 검증
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
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "PortOne 결제 조회 실패" } },
        { status: 500 },
      );
    }

    const portonePayment = await portoneRes.json() as {
      status: string;
      amount: { total: number };
    };

    // 실제 결제 금액이 DB 기대 금액과 다르면 위변조로 간주
    if (
      portonePayment.status !== "PAID" ||
      portonePayment.amount.total !== payment.amount
    ) {
      await db.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "결제 금액 불일치" } },
        { status: 400 },
      );
    }

    await Promise.all([
      db.from("payments").update({ status: "paid", paid_at: now }).eq("id", payment.id),
      db.from("reservations").update({ status: "paid", paid_at: now }).eq("id", payment.reservation_id),
    ]);
  } else if (type === "Transaction.Cancelled") {
    await Promise.all([
      db.from("payments").update({ status: "canceled", canceled_at: now }).eq("id", payment.id),
      db.from("reservations").update({ status: "canceled", canceled_at: now }).eq("id", payment.reservation_id),
    ]);
  } else if (type === "Transaction.Failed") {
    await db.from("payments").update({ status: "failed" }).eq("id", payment.id);
  }

  return NextResponse.json({ data: { ok: true } });
}
