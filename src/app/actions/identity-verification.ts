"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

interface PortOneVerificationResult {
  status: string;
}

export async function verifyIdentity(identityVerificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: userRow } = await db
    .from("users")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (userRow?.is_verified) {
    return { data: { is_verified: true } };
  }

  const portoneRes = await fetch(
    `https://api.portone.io/identity-verifications/${identityVerificationId}`,
    {
      headers: { Authorization: `PortOne ${process.env.PORTONE_API_SECRET}` },
      cache: "no-store",
    },
  );

  if (!portoneRes.ok) {
    if (portoneRes.status === 404) {
      return {
        error: { code: "VERIFICATION_NOT_FOUND", message: "존재하지 않는 인증 ID입니다." },
      };
    }
    return {
      error: { code: "INTERNAL_ERROR", message: "본인인증 결과 조회에 실패했습니다." },
    };
  }

  const verification: PortOneVerificationResult = await portoneRes.json();

  if (verification.status !== "VERIFIED") {
    return {
      error: { code: "VALIDATION_ERROR", message: "본인인증이 완료되지 않았습니다." },
    };
  }

  const { error } = await db
    .from("users")
    .update({ is_verified: true })
    .eq("id", user.id);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { is_verified: true } };
}
