"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { completeSignup } from "./actions";

export default function SignupForm() {
  const router = useRouter();
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

      if (!response) {
        setError("본인인증에 실패했습니다.");
        return;
      }

      if (response.code) {
        setError(response.message ?? "본인인증에 실패했습니다.");
        return;
      }

      const result = await completeSignup(identityVerificationId);
      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push("/");
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
        {isPending ? "처리 중..." : "본인인증하기"}
      </button>
    </div>
  );
}
