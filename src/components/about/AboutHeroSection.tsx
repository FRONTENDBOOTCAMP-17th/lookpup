import Image from "next/image";

export default function AboutHeroSection() {
  return (
    <section className="bg-gradient-to-b from-white via-white to-orange-50 py-16 md:py-20">
      <div className="mx-auto flex flex-col items-center text-center">
        {/* 로고 */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <span className="text-orange-500 text-base md:text-lg font-bold tracking-widest uppercase">
            lookpup
          </span>

          <Image
            src="/logo.png"
            alt="lookpup 로고"
            width={260}
            height={120}
            className="object-contain w-44 md:w-64 h-auto"
            priority
          />
        </div>
        <br></br>

        <p className="text-gray-500 text-sm md:text-lg leading-6 md:leading-7 w-[300px] md:w-auto">
          lookpup은 <strong className="text-stone-700">보호자</strong>와{" "}
          <strong className="text-stone-700">펫시터</strong>를 신뢰 기반으로
          연결하는
          <br className="md:hidden" /> 반려동물 케어 중개 플랫폼입니다.
          <br />
          인증된 시터 검색부터 예약, 결제, 후기까지
          <br className="md:hidden" /> 하나의 서비스로 경험해보세요.
        </p>
      </div>
    </section>
  );
}
