import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Shield,
  Calendar,
  MessageCircle,
  Star,
  MapPin,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/server";

const FEATURES = [
  {
    icon: MapPin,
    title: "위치 기반 매칭",
    desc: "현재 위치 또는 원하는 지역을 기준으로 가까운 펫시터를 우선 노출합니다.",
  },
  {
    icon: Search,
    title: "지역·조건 맞춤 검색",
    desc: "서비스 유형, 가격대, 지역을 조합해 딱 맞는 펫시터를 빠르게 찾을 수 있습니다.",
  },
  {
    icon: Calendar,
    title: "실시간 예약 관리",
    desc: "달력으로 가능한 날짜를 실시간 확인하고, 예약 확정부터 완료까지 단계별로 추적합니다.",
  },
  {
    icon: MessageCircle,
    title: "1:1 채팅 소통",
    desc: "예약 전후 언제든지 채팅으로 소통하고 돌봄 상황을 실시간으로 파악할 수 있습니다.",
  },
  {
    icon: Star,
    title: "검증된 리뷰",
    desc: "실제 예약을 완료한 보호자만 리뷰를 작성할 수 있어 신뢰할 수 있는 후기를 확인할 수 있습니다.",
  },
];

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

const FAQS = [
  {
    q: "서비스 중 반려동물이 다쳤을 경우 어떻게 되나요?",
    a: "펫시터의 과실이 확인된 경우, 당사는 예약 내역·채팅 기록 등 플랫폼 내 증거 자료를 보관하고 분쟁 조정 시 이를 제공합니다. 다만 lookpup은 중개 플랫폼으로 직접적인 의료비 보상 의무는 없으며, 손해배상 청구는 보호자-펫시터 간 민사 절차(또는 소비자분쟁조정위원회)를 통해 진행됩니다. 보호자분께서는 서비스 이용 전 반려동물 의료보험 가입을 권장드립니다.",
  },
  {
    q: "펫시터가 연락이 되지 않거나 서비스를 이행하지 않으면 어떻게 하나요?",
    a: "예약 확정 후 펫시터가 무단으로 서비스를 이행하지 않은 경우 전액 환불 처리됩니다. 고객센터에 신고하시면 해당 펫시터 계정은 즉시 이용 정지되며, 반복 위반 시 영구 제재됩니다. 채팅 기록과 예약 데이터는 분쟁 증빙 자료로 활용될 수 있도록 90일간 보관됩니다.",
  },
  {
    q: "펫시터 인증은 어떻게 진행되나요?",
    a: "신분증 실명 확인(필수)과 반려동물 관련 자격증 사본 제출(권장)을 통해 검토합니다. 심사는 영업일 기준 2~5일 소요되며, 허위 서류 제출이 확인될 경우 계정은 즉시 영구 정지되고 관련 기관에 통보될 수 있습니다.",
  },
  {
    q: "예약 취소 및 환불 정책이 어떻게 되나요?",
    a: "서비스 시작 3일 이전 취소 시 100% 환불, 1~2일 전 취소 시 50% 환불, 당일 취소 또는 노쇼는 환불이 불가합니다. 펫시터 귀책 사유로 인한 취소는 취소 시점과 무관하게 전액 환불됩니다.",
  },
  {
    q: "결제는 어떻게 이루어지며 안전한가요?",
    a: "토스페이먼츠를 통해 신용카드, 계좌이체, 간편결제(토스페이·카카오페이 등)를 지원합니다. 결제 정보는 토스페이먼츠의 PCI-DSS 인증 보안 시스템으로 안전하게 관리됩니다.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* 히어로 */}
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

        {/* 주요 기능 */}
        <section className="py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
              주요 기능
            </h2>
            <p className="text-gray-500 text-center mb-10 md:mb-14">
              lookpup이 제공하는 핵심 기능을 확인하세요
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col gap-4 hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0px_8px_24px_0px_rgba(232,116,42,0.15)] transition-all duration-200"
                >
                  <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-orange-500" />
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

        {/* 이용 방법 - 보호자 */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-8 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-2">
              이용 방법
            </h2>
            <p className="text-gray-500 text-center mb-10 md:mb-14">
              간단한 단계로 시작할 수 있습니다
            </p>

            {/* 보호자 플로우 */}
            <p className="text-orange-500 font-semibold text-center mb-6">
              보호자
            </p>
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
                    <h3 className="text-stone-900 text-base font-semibold mb-1">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 펫시터 플로우 */}
            <p className="text-stone-600 font-semibold text-center mb-6">
              펫시터
            </p>
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
                    <h3 className="text-stone-900 text-base font-semibold mb-1">
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
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
              자주 묻는 질문
            </h2>
            <p className="text-gray-500 text-center mb-10 md:mb-14">
              궁금한 점을 미리 확인하세요
            </p>
            <div className="flex flex-col gap-4">
              {FAQS.map(({ q, a }) => (
                <div
                  key={q}
                  className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex items-start gap-4"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                    <span
                      className="text-white text-base font-bold"
                      aria-label="질문"
                    >
                      Q
                    </span>
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
      </main>

      <Footer />
    </>
  );
}
