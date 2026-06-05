"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-stone-50/50 to-white flex items-center justify-center p-5">
      <div className="w-115 flex flex-col items-start">
        {/* 로고 */}
        <div className="w-full flex flex-col items-center gap-2 mb-8">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="봐주개"
              width={160}
              height={48}
              className="object-contain h-auto"
            />
          </Link>
          <p className="text-gray-500 text-base">반려동물 돌봄 플랫폼</p>
        </div>

        {/* 카드 */}
        <div className="w-full p-8 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col">
          <h1 className="text-2xl font-bold text-stone-900 text-center mb-2">
            회원가입
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            본인인증을 완료하면 바로 이용할 수 있어요
          </p>

          <button
            onClick={() => router.push("/verification")}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center gap-3 text-base font-medium transition-colors"
          >
            <ShieldCheck size={18} />
            본인인증하기
          </button>

          <p className="text-center text-sm mt-6">
            <span className="text-gray-500">이미 계정이 있으신가요? </span>
            <Link
              href="/auth/login"
              className="text-orange-500 font-medium hover:underline"
            >
              로그인
            </Link>
          </p>

          <p className="text-center text-gray-500 text-xs mt-5 leading-5">
            계속 진행하면{" "}
            <Link href="/terms" className="underline hover:text-stone-700">
              이용약관
            </Link>{" "}
            및 개인정보 처리방침에 동의하는 것으로 간주합니다
          </p>
        </div>
      </div>
    </div>
  );
}
