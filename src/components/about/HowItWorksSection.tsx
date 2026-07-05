import ScrollReveal from "@/components/common/ScrollReveal";

const STEPS_OWNER = [
  {
    num: 1,
    title: "펫시터 검색",
    desc: "지역·서비스·가격대로 원하는 시터 찾기",
  },
  { num: 2, title: "돌봄 요청", desc: "날짜·반려동물 선택 후 요청 전송" },
  { num: 3, title: "확정 & 결제", desc: "펫시터 수락 후 결제하면 예약 확정" },
  { num: 4, title: "돌봄 진행", desc: "실시간 채팅으로 상태 확인" },
  {
    num: 5,
    title: "후기 작성",
    desc: "솔직한 경험 공유로 다른 보호자에게 도움",
  },
];

const STEPS_SITTER = [
  { num: 1, title: "펫시터 등록", desc: "본인 인증 후 서비스·가격 등록" },
  {
    num: 2,
    title: "예약 매칭",
    desc: "받은 예약 요청 수락 또는 구인글에 직접 지원",
  },
  { num: 3, title: "예약 확정", desc: "보호자 결제 완료로 예약 확정" },
  { num: 4, title: "돌봄 제공", desc: "약속된 서비스 성실히 수행" },
  { num: 5, title: "정산 수령", desc: "서비스 완료 후 수익 지급" },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-8 sm:px-10">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-2">
            이용 방법
          </h2>
          <p className="text-gray-500 text-center mb-10 md:mb-14">
            간단한 단계로 시작할 수 있습니다
          </p>
        </ScrollReveal>

        {/* 보호자 플로우 */}
        <p className="text-orange-500 font-semibold text-center mb-6">보호자</p>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between relative gap-6 md:gap-0 mb-14">
          <div className="hidden md:block absolute top-8 left-18 right-18 h-px border-t-2 border-dashed border-orange-100" />
          {STEPS_OWNER.map(({ num, title, desc }, index) => (
            <ScrollReveal
              key={num}
              delay={index * 0.08}
              className="flex md:flex-col items-start md:items-center text-left md:text-center md:w-36 relative z-10 gap-4 md:gap-0"
            >
              <div className="w-16 h-16 shrink-0 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold md:mb-4">
                {num}
              </div>
              <div>
                <h3 className="text-stone-900 text-base font-semibold mb-1">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-5">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* 펫시터 플로우 */}
        <p className="text-stone-600 font-semibold text-center mb-6">펫시터</p>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between relative gap-6 md:gap-0">
          <div className="hidden md:block absolute top-8 left-18 right-18 h-px border-t-2 border-dashed border-stone-200" />
          {STEPS_SITTER.map(({ num, title, desc }, index) => (
            <ScrollReveal
              key={num}
              delay={index * 0.08}
              className="flex md:flex-col items-start md:items-center text-left md:text-center md:w-36 relative z-10 gap-4 md:gap-0"
            >
              <div className="w-16 h-16 shrink-0 bg-stone-700 rounded-full flex items-center justify-center text-white text-2xl font-bold md:mb-4">
                {num}
              </div>
              <div>
                <h3 className="text-stone-900 text-base font-semibold mb-1">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-5">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
