"use client";

import { useRouter } from "next/navigation";
import Verification from "@/components/Verification";
import { useUserStore } from "@/store/userStore";
import { completeSignup } from "./actions";

export default function SignupForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const verifyUser = useUserStore((s) => s.verifyUser);

  return (
    <Verification
      onVerified={completeSignup}
      onSuccess={() => {
        verifyUser();
        router.push(next);
      }}
    />
  );
}
