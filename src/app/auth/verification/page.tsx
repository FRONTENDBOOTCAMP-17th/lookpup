import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isUserVerified } from "@/utils/supabase/service";
import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { next } = await searchParams;
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (await isUserVerified(user.id)) redirect(redirectTo);

  return (
    <div className="min-h-screen bg-linear-to-b from-orange-50 via-stone-50/50 to-white flex items-center justify-center p-5">
      <div className="w-115 flex flex-col items-start">
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

        <div className="w-full p-8 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col">
          <h1 className="text-2xl font-bold text-stone-900 text-center mb-2">
            회원가입
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            본인인증을 완료하면 바로 이용할 수 있어요
          </p>

          <SignupForm next={redirectTo} />

          <p className="text-center text-sm mt-6">
            <Link
              href="/"
              className="text-orange-500 font-medium hover:underline"
            >
              다음에 하기
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
