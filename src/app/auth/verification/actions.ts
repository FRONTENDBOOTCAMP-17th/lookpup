"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { redirect } from "next/navigation";

interface PortOneVerifiedCustomer {
  name: string;
  gender: string;
  birthDate: string;
  phoneNumber: string;
}

interface PortOneVerificationResult {
  status: string;
  verifiedCustomer?: PortOneVerifiedCustomer;
}

export async function completeSignup(identityVerificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  try {
    const portoneRes = await fetch(
      `https://api.portone.io/identity-verifications/${identityVerificationId}`,
      {
        headers: { Authorization: `PortOne ${process.env.PORTONE_API_SECRET}` },
        cache: "no-store",
      },
    );

    if (!portoneRes.ok) {
      const body = await portoneRes.text();
      console.error("[completeSignup] PortOne API error", portoneRes.status, body);
      return { error: `결과 조회 실패 (${portoneRes.status}): ${body}` };
    }

    const verificationData: PortOneVerificationResult = await portoneRes.json();

    if (
      verificationData.status !== "VERIFIED" ||
      !verificationData.verifiedCustomer
    ) {
      return { error: "본인인증이 완료되지 않았습니다." };
    }

    const { name, gender, birthDate, phoneNumber } =
      verificationData.verifiedCustomer;

    const db = createServiceClient();

    // 전화번호 중복 검증 (deleted_at IS NULL 조건)
    const { data: duplicatePhone } = await db
      .from("users")
      .select("id")
      .eq("phone_number", phoneNumber)
      .is("deleted_at", null)
      .maybeSingle();

    if (duplicatePhone) return { error: "이미 가입된 전화번호입니다." };

    const { error: updateError } = await db
      .from("users")
      .update({
        full_name: name,
        birthdate: birthDate,
        phone_number: phoneNumber,
        gender: gender === "FEMALE" ? "FEMALE" : "MALE",
        is_verified: true,
      })
      .eq("id", user.id);

    if (updateError)
      return { error: `[${updateError.code}] ${updateError.message}` };

    return { success: true };
  } catch {
    return { error: "알 수 없는 오류가 발생했습니다." };
  }
}
