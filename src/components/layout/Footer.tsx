import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-stone-900">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          <div>
            <Link href="/" className="mb-2 inline-block">
              <Image
                src="/logo.png"
                alt="봐주개"
                width={100}
                height={30}
                className="object-contain h-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-500 text-sm">
              믿을 수 있는 반려동물 돌봄 플랫폼
            </p>
          </div>

          <div className="flex gap-12 md:gap-16">
            <div className="flex flex-col gap-4">
              <span className="text-white text-base font-semibold">서비스</span>
              <div className="flex flex-col gap-2">
                <Link
                  href="/petsitters"
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                >
                  펫시터 찾기
                </Link>
                <Link
                  href="/board"
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                >
                  구인게시판
                </Link>
                <Link
                  href="/about"
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                >
                  서비스 소개
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white text-base font-semibold">정보</span>
              <div className="flex flex-col gap-2">
                <Link
                  href="/terms"
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                >
                  이용약관
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                >
                  개인정보처리방침
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-10 py-4">
          <p className="text-center text-gray-500 text-xs">
            © 2026 봐주개. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
