import Link from "next/link";

export default function CtaSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="py-16 md:py-20 bg-linear-to-r from-orange-500 to-stone-600">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 flex flex-col items-center text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          지금 lookpup을 시작해보세요
        </h2>
        <p className="text-white/90 text-base md:text-lg leading-7 mb-8">
          보호자도, 펫시터도 — 반려동물 돌봄의 새로운 기준을 경험하세요
        </p>
        <div className="flex flex-row gap-4">
          {!isLoggedIn && (
            <Link
              href="/auth/verification"
              className="w-40 h-12 bg-white text-orange-500 text-base font-semibold rounded-[10px] border border-orange-500 flex items-center justify-center hover:bg-orange-50 transition-colors"
            >
              회원가입
            </Link>
          )}
          <Link
            href="/petsitters"
            className="w-40 h-12 bg-white/20 text-white text-base font-semibold rounded-[10px] border-2 border-white flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            펫시터 찾아보기
          </Link>
        </div>
      </div>
    </section>
  );
}
