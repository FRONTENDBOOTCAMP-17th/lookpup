"use client";

import { useState, useEffect, useRef } from "react";

type PortOneSDK = typeof import("@portone/browser-sdk/v2");
type PaymentStatus = "idle" | "success" | "fail";

interface RequestPaymentParams {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency?: string;
  payMethod?: string;
  redirectUrl?: string;
  customer?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  };
}

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY_TOSS;

export function usePortOne() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const portOneRef = useRef<PortOneSDK | null>(null);

  useEffect(() => {
    import("@portone/browser-sdk/v2").then((sdk) => {
      portOneRef.current = sdk;
    });
  }, []);

  const requestPayment = (params: RequestPaymentParams) => {
    if (isPending || !portOneRef.current) return;

    setIsPending(true);
    setStatus("idle");
    setErrorMessage(null);

    const PortOne = portOneRef.current;

    PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY,
      currency: "KRW",
      payMethod: "CARD",
      ...params,
    })
      .then((response) => {
        if (!response) {
          setStatus("fail");
          setErrorMessage("결제창이 닫혔습니다.");
          return;
        }
        if ("code" in response) {
          setStatus("fail");
          setErrorMessage(response.message ?? "결제에 실패했습니다.");
          return;
        }
        setStatus("success");
      })
      .catch((err: unknown) => {
        setStatus("fail");
        setErrorMessage(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        );
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return { status, errorMessage, isPending, requestPayment };
}
