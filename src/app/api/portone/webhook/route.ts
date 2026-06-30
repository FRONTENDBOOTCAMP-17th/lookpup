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
    .select("id, reservation_id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ data: { ok: true } });
  }

  const now = new Date().toISOString();

  if (type === "Transaction.Paid") {
    const { data: reservation } = await db
      .from("reservations")
      .select("status")
      .eq("id", payment.reservation_id)
      .single();

    await db
      .from("payments")
      .update({ status: "paid", paid_at: now })
      .eq("id", payment.id);

    if (reservation?.status === "accepted") {
      await db
        .from("reservations")
        .update({ status: "paid", paid_at: now })
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
    ]);
  } else if (type === "Transaction.Failed") {
    await db.from("payments").update({ status: "failed" }).eq("id", payment.id);
  }

  return NextResponse.json({ data: { ok: true } });
}
