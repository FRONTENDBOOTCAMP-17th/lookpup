const STEPS_OWNER = [
  { num: 1, title: "펫시터 검색", desc: "지역·서비스 종류·가격대로 필터링" },
  { num: 2, title: "프로필 비교", desc: "자격증·경력·후기 꼼꼼히 확인" },
  { num: 3, title: "채팅 문의", desc: "예약 전 궁금한 점을 직접 질문" },
  { num: 4, title: "예약 & 결제", desc: "날짜·시간 선택 후 안전하게 결제" },
  { num: 5, title: "돌봄 진행", desc: "실시간 채팅으로 상태 확인" },
  { num: 6, title: "후기 작성", desc: "솔직한 후기로 커뮤니티에 기여" },
];

const STEPS_SITTER = [
  { num: 1, title: "회원가입", desc: "기본 정보 입력 후 가입" },
  { num: 2, title: "신원 인증", desc: "신분증·자격증 서류 제출" },
  { num: 3, title: "프로필 작성", desc: "서비스·가격·일정 설정" },
  { num: 4, title: "예약 수락", desc: "보호자 요청 검토 후 수락" },
  { num: 5, title: "돌봄 제공", desc: "약속된 서비스 성실히 수행" },
  { num: 6, title: "정산 수령", desc: "서비스 완료 후 자동 정산" },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-8 sm:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-2">
          이용 방법
        </h2>
        <p className="text-gray-500 text-center mb-10 md:mb-14">
          간단한 단계로 시작할 수 있습니다
        </p>

        {/* 보호자 플로우 */}
        <p className="text-orange-500 font-semibold text-center mb-6">보호자</p>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between relative gap-6 md:gap-0 mb-14">
          <div className="hidden md:block absolute top-8 left-[calc(8%+32px)] right-[calc(8%+32px)] h-px border-t-2 border-dashed border-orange-100" />
          {STEPS_OWNER.map(({ num, title, desc }) => (
            <div
              key={num}
              className="flex md:flex-col items-start md:items-center text-left md:text-center md:w-36 relative z-10 gap-4 md:gap-0"
            >
              <div className="w-16 h-16 shrink-0 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold md:mb-4">
                {num}
              </div>
              <div>
                <h3 className="text-stone-900 text-base font-semibold mb-1">{title}</h3>
                <p className="text-gray-500 text-sm leading-5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 펫시터 플로우 */}
        <p className="text-stone-600 font-semibold text-center mb-6">펫시터</p>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between relative gap-6 md:gap-0">
          <div className="hidden md:block absolute top-8 left-[calc(8%+32px)] right-[calc(8%+32px)] h-px border-t-2 border-dashed border-stone-200" />
          {STEPS_SITTER.map(({ num, title, desc }) => (
            <div
              key={num}
              className="flex md:flex-col items-start md:items-center text-left md:text-center md:w-36 relative z-10 gap-4 md:gap-0"
            >
              <div className="w-16 h-16 shrink-0 bg-stone-700 rounded-full flex items-center justify-center text-white text-2xl font-bold md:mb-4">
                {num}
              </div>
              <div>
                <h3 className="text-stone-900 text-base font-semibold mb-1">{title}</h3>
                <p className="text-gray-500 text-sm leading-5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
