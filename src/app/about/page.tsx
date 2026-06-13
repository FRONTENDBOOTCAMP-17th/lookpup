import Link from "next/link";
import { Search, Shield, Calendar, MessageCircle, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// 소개란 정보값

const STATS = [
  { value: "1,500+", label: "인증 펫시터" },
  { value: "10,000+", label: "완료된 예약" },
  { value: "4.9", label: "평균 평점" },
];

const FEATURES = [
  {
    icon: Search,
    color: "bg-orange-500/10",
    iconColor: "text-orange-500",
    title: "쉬운 펫시터 검색",
    desc: "지역, 서비스 종류, 가격대로 필터링하여 딱 맞는 펫시터를 찾아보세요",
  },
  {
    icon: Shield,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    title: "안전한 인증 시스템",
    desc: "신원 확인과 자격증 인증을 완료한 펫시터만 활동할 수 있습니다",
  },
  {
    icon: Calendar,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: "간편한 예약 관리",
    desc: "원하는 날짜와 시간을 선택하고 실시간으로 예약을 관리하세요",
  },
  {
    icon: MessageCircle,
    color: "bg-amber-500/10",
    iconColor: "text-amber-500",
    title: "실시간 소통",
    desc: "펫시터와 채팅으로 소통하며 반려동물 상태를 실시간으로 확인하세요",
  },
  {
    icon: Star,
    color: "bg-violet-500/10",
    iconColor: "text-violet-500",
    title: "투명한 리뷰 시스템",
    desc: "실제 이용자들의 후기를 확인하고 믿을 수 있는 선택을 하세요",
  },
];

const STEPS = [
  {
    num: 1,
    title: "펫시터 검색",
    desc: "지역과 서비스를 선택하여 마음에 드는 펫시터를 찾아보세요",
  },
  {
    num: 2,
    title: "프로필 확인",
    desc: "펫시터의 경력, 후기, 인증서를 꼼꼼히 확인하세요",
  },
  {
    num: 3,
    title: "예약 및 결제",
    desc: "날짜와 시간을 선택하고 안전하게 결제하세요",
  },
  {
    num: 4,
    title: "서비스 이용",
    desc: "채팅으로 소통하며 안심하고 서비스를 이용하세요",
  },
  {
    num: 5,
    title: "후기 작성",
    desc: "서비스 이용 후 솔직한 후기를 남겨주세요",
  },
];

const FAQS = [
  {
    q: "펫시터 인증은 어떻게 진행되나요?",
    a: "신분증 확인, 반려동물 관련 자격증 확인, 범죄경력조회를 통해 안전한 펫시터만 활동할 수 있도록 합니다.",
  },
  {
    q: "예약 취소는 어떻게 하나요?",
    a: "예약 3일 전까지는 100% 환불, 1-2일 전은 50% 환불, 당일 취소는 환불이 불가합니다.",
  },
  {
    q: "서비스 중 문제가 생기면 어떻게 하나요?",
    a: "24시간 고객센터를 운영하고 있으며, 긴급 상황 시 즉시 대응팀이 출동합니다.",
  },
  {
    q: "펫시터로 활동하려면 어떻게 해야 하나요?",
    a: "회원가입 후 펫시터 등록을 진행하시면 됩니다. 인증 심사는 3-5일 소요됩니다.",
  },
  {
    q: "결제는 어떻게 이루어지나요?",
    a: "신용카드, 계좌이체, 간편결제를 지원하며, 서비스 완료 후 정산됩니다.",
  },
];

// 페이지

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* 히어로*/}
        <section className="bg-gradient-to-b from-white via-white to-orange-50 py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10 flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight mb-6">
              <span className="whitespace-nowrap">우리 아이를</span>
              <br className="sm:hidden" />{" "}
              <span className="whitespace-nowrap">믿고 맡길 수 있는</span>
              <br />
              <span className="whitespace-nowrap">펫시터를 만나보세요</span>
            </h1>
            <p className="text-gray-500 text-base md:text-xl leading-7 mb-10 md:mb-16">
              <span className="whitespace-nowrap">
                검증된 펫시터와 함께하는
              </span>{" "}
              <span className="whitespace-nowrap">
                안전하고 편리한 반려동물 케어 서비스
              </span>
            </p>

            {/* 통계 */}
            <div className="grid grid-cols-3 w-full max-w-3xl">
              {STATS.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-orange-500 text-2xl md:text-4xl font-bold">
                    {value}
                  </span>
                  <span className="text-gray-500 text-sm md:text-base mt-2">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-8 md:mb-12">
              주요 기능
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
              {FEATURES.map(({ icon: Icon, color, iconColor, title, desc }, index) => (
                <div
                  key={title}
                  className={`p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col gap-4 hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0px_8px_24px_0px_rgba(232,116,42,0.15)] transition-all duration-200 lg:col-span-2${
                    index === 3 ? " lg:row-start-2 lg:col-start-2" :
                    index === 4 ? " lg:row-start-2 lg:col-start-4" : ""
                  }`}
                >
                  <div
                    className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}
                  >
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <h3 className="text-stone-900 text-lg font-semibold">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-base leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-8 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-8 md:mb-12">
              이용 방법
            </h2>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between relative gap-6 md:gap-0">
              {/* 연결선 - 데스크탑만 */}
              <div className="hidden md:block absolute top-8 left-[calc(10%+32px)] right-[calc(10%+32px)] h-px border-t-2 border-dashed border-orange-100" />
              {STEPS.map(({ num, title, desc }) => (
                <div
                  key={num}
                  className="flex md:flex-col items-start md:items-center text-left md:text-center md:w-50 relative z-10 gap-4 md:gap-0"
                >
                  <div className="w-16 h-16 shrink-0 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold md:mb-4">
                    {num}
                  </div>
                  <div>
                    <h3 className="text-stone-900 text-lg font-semibold mb-1 md:mb-2">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-8 md:mb-12">
              자주 묻는 질문
            </h2>
            <div className="flex flex-col gap-4">
              {FAQS.map(({ q, a }) => (
                <div
                  key={q}
                  className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex items-start gap-4"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-base font-bold" aria-label="질문">Q</span>
                  </div>
                  <div>
                    <h3 className="text-stone-900 text-lg font-semibold mb-2">
                      {q}
                    </h3>
                    <p className="text-gray-500 text-base leading-6">{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-linear-to-r from-orange-500 to-stone-600">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10 flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              지금 시작해보세요
            </h2>
            <p className="text-white/90 text-base md:text-lg leading-7 mb-8">
              믿을 수 있는 펫시터와 함께 소중한 반려동물을 케어하세요
            </p>
            <div className="flex flex-row gap-4">
              <Link
                href="/auth/signup"
                className="w-40 h-12 bg-white text-orange-500 text-base font-semibold rounded-[10px] border border-orange-500 flex items-center justify-center hover:bg-orange-50 transition-colors"
              >
                회원가입
              </Link>
              <Link
                href="/petsitters"
                className="w-40 h-12 bg-white/20 text-white text-base font-semibold rounded-[10px] border-2 border-white flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                펫시터 찾아보기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
