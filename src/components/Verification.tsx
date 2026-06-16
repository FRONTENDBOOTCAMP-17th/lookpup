"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";

interface VerificationProps {
  // PortOne 인증 성공 후 호출 — 비즈니스 로직(DB 저장 등)을 여기서 처리
  // { error: string }을 반환하면 에러 메시지를 표시, 아무것도 반환하지 않으면 onSuccess 호출
  onVerified: (
    identityVerificationId: string,
  ) => Promise<{ error?: string } | void>;
  // onVerified 성공 후 호출 — 페이지 이동 등
  onSuccess?: () => void;
  buttonText?: string;
}

export default function Verification({
  onVerified,
  onSuccess,
  buttonText = "본인인증하기",
}: VerificationProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    setError(null);

    startTransition(async () => {
      const PortOne = await import("@portone/browser-sdk/v2");

      const identityVerificationId = `identity-${crypto.randomUUID()}`;

      const response = await PortOne.requestIdentityVerification({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY!,
        identityVerificationId,
      });

      if (!response || "code" in response) {
        setError(
          (response as { message?: string } | null)?.message ??
            "본인인증에 실패했습니다.",
        );
        return;
      }

      const result = await onVerified(identityVerificationId);
      if (result?.error) {
        setError(result.error);
        return;
      }

      onSuccess?.();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isPending}
        className="w-full h-14 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white rounded-xl flex items-center justify-center gap-3 text-base font-medium transition-colors"
      >
        <ShieldCheck size={18} />
        {isPending ? "처리 중..." : buttonText}
      </button>
    </div>
  );
}
