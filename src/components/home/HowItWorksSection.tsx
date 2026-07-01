const STEPS = [
  { num: 1, title: "펫시터 검색", desc: "우리 동네 펫시터를 찾아보세요" },
  { num: 2, title: "예약 & 결제", desc: "간편하게 예약하고 안전하게 결제하세요" },
  { num: 3, title: "안심 돌봄", desc: "믿고 맡기는 반려동물 케어" },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 text-center mb-16">
          이용 방법
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-0 relative">
          <div className="hidden lg:block absolute top-10 left-[calc(33.33%+48px)] right-[calc(33.33%+48px)] h-px border-t border-dashed border-orange-200" />

          {STEPS.map(({ num, title, desc }) => (
            <div
              key={num}
              className="flex lg:flex-col items-start lg:items-center gap-6 lg:gap-0 lg:text-center"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shrink-0 relative z-10">
                {num}
              </div>
              <div className="lg:mt-6">
                <h3 className="text-stone-900 text-lg font-semibold">{title}</h3>
                <p className="text-gray-500 text-base mt-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
