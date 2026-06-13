import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Star,
  ChevronRight,
  Shield,
  CreditCard,
  MessageSquare,
  Home,
  User,
  Activity,
  Building,
  Car,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import MobileHeader from "@/components/layout/MobileHeader";

// 더미데이터 꼬라박기

const SERVICES: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Home, label: "방문돌봄", desc: "집에서 안전하게" },
  { Icon: User, label: "위탁돌봄", desc: "펫시터 집에서" },
  { Icon: Activity, label: "산책", desc: "건강한 산책" },
  { Icon: Building, label: "펫호텔", desc: "프리미엄 케어" },
  { Icon: Car, label: "픽업", desc: "편리한 이동" },
];

const PETSITTERS = [
  {
    id: 1,
    name: "김민지",
    initial: "김",
    district: "마포구",
    rating: 4.9,
    reviews: 47,
    price: "30,000",
    services: ["방문돌봄", "산책"],
    certified: true,
  },
  {
    id: 2,
    name: "이서연",
    initial: "이",
    district: "강남구",
    rating: 4.8,
    reviews: 32,
    price: "35,000",
    services: ["방문돌봄", "산책"],
    certified: false,
  },
  {
    id: 3,
    name: "박준호",
    initial: "박",
    district: "용산구",
    rating: 4.7,
    reviews: 28,
    price: "28,000",
    services: ["방문돌봄", "산책"],
    certified: false,
  },
  {
    id: 4,
    name: "최예진",
    initial: "최",
    district: "성동구",
    rating: 4.6,
    reviews: 15,
    price: "32,000",
    services: ["방문돌봄", "산책"],
    certified: false,
  },
];

const STEPS = [
  { num: 1, title: "펫시터 검색", desc: "우리 동네 펫시터를 찾아보세요" },
  {
    num: 2,
    title: "예약 & 결제",
    desc: "간편하게 예약하고 안전하게 결제하세요",
  },
  { num: 3, title: "안심 돌봄", desc: "믿고 맡기는 반려동물 케어" },
];

const TRUST_ITEMS: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Shield,
    title: "인증된 펫시터",
    desc: "신원확인과 자격증 검증을 거친 펫시터만 등록됩니다",
  },
  {
    Icon: CreditCard,
    title: "안전한 결제",
    desc: "에스크로 시스템으로 안전하게 거래하세요",
  },
  {
    Icon: MessageSquare,
    title: "실제 후기",
    desc: "검증된 이용자의 진짜 후기를 확인하세요",
  },
];

// 컴포넌트

function PetsitterCard({
  id,
  name,
  initial,
  district,
  rating,
  reviews,
  price,
  services,
  certified,
}: (typeof PETSITTERS)[0]) {
  return (
    <Link
      href={`/petsitters/${id}`}
      className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col gap-4 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow"
    >
      <div className="flex items-start gap-3">
        <Avatar initial={initial} size="lg" variant="orange" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-stone-900 text-base font-semibold">
              {name}
            </span>
            {certified && (
              <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium">
                인증
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 text-xs">{district}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {services.map((s) => (
          <span
            key={s}
            className="px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-medium"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-orange-100">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-stone-900 text-sm font-bold">
            {rating.toFixed(1)}
          </span>
          <span className="text-gray-500 text-xs">({reviews})</span>
        </div>
        <span className="text-orange-500 text-sm font-semibold">
          {price}원~
        </span>
      </div>
    </Link>
  );
}

// 페이지

export default function HomePage() {
  return (
    <>
      <div className="hidden lg:block">
        <Header />
      </div>
      <MobileHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-orange-50 via-stone-50/20 to-white min-h-[600px] flex items-center overflow-hidden relative">
          {/* 배경 🐾 */}
          <span className="absolute left-20 top-20 text-6xl opacity-5 select-none pointer-events-none">
            🐾
          </span>
          <span className="absolute right-40 top-40 text-4xl opacity-5 select-none pointer-events-none">
            🐾
          </span>
          <span className="absolute left-[40%] bottom-20 text-5xl opacity-5 select-none pointer-events-none">
            🐾
          </span>

          <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-16 md:py-20 w-full flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* 텍스트 */}

            <div className="flex-1 max-w-[560px] flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 bg-orange-50 rounded-full border border-orange-100 mb-6">
                <span className="text-orange-500 text-xs font-medium">
                  반려동물 돌봄 플랫폼 🐾
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-stone-900 mb-6">
                우리 아이를{" "}
                <span className="text-orange-500 whitespace-nowrap">
                  믿고 맡길 수 있는
                </span>
                <br />
                반려동물 돌봄 플랫폼
              </h1>

              <p className="text-gray-500 text-base sm:text-lg leading-7 mb-8">
                지역 기반 검색으로 가까운 펫시터를 찾고,
                <br />
                안전한 예약과 결제까지 한 번에
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                <Link
                  href="/petsitters"
                  className="w-40 h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(232,116,42,0.15)] transition-colors"
                >
                  펫시터 찾기
                </Link>
                <Link
                  href="/sitter-register"
                  className="w-40 h-12 bg-white hover:bg-orange-50 text-orange-500 text-base font-semibold rounded-[10px] border border-orange-500 flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(232,116,42,0.15)] transition-colors"
                >
                  펫시터 등록하기
                </Link>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center lg:text-left">
                  <p className="text-orange-500 text-2xl font-bold">5,200+</p>
                  <p className="text-gray-500 text-sm">펫시터</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-orange-500 text-2xl font-bold">98%</p>
                  <p className="text-gray-500 text-sm">만족도</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-stone-900 text-sm font-bold">
                    안전 에스크로 결제
                  </p>
                  <p className="text-gray-500 text-xs">보장된 거래</p>
                </div>
              </div>
            </div>

            {/* 플로팅 카드 */}
            <div className="hidden lg:block relative w-[420px] h-[480px] shrink-0">
              {/* 카드 1 */}
              <div className="-rotate-3 absolute top-12 left-8 w-80 shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)] rounded-2xl z-10">
                <div className="p-5 bg-white rounded-2xl border border-orange-100">
                  <div className="flex items-start gap-4">
                    <Avatar initial="김" size="lg" variant="orange" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-stone-900 text-lg font-semibold">
                          김민지 펫시터
                        </span>
                        <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[10px] font-medium">
                          인증
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          서울 마포구
                        </span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <span className="px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-medium">
                          방문돌봄
                        </span>
                        <span className="px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-medium">
                          산책
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-stone-900 text-sm font-bold">
                            4.9
                          </span>
                          <span className="text-gray-500 text-xs">(47)</span>
                        </div>
                        <span className="text-orange-500 text-sm font-semibold">
                          30,000원~
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 카드 2 */}
              <div className="rotate-3 absolute bottom-20 right-0 w-72 opacity-80 shadow-lg rounded-2xl">
                <div className="p-5 bg-white rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-orange-500 text-xl font-semibold">
                        박
                      </span>
                    </div>
                    <div>
                      <p className="text-stone-900 text-lg font-semibold">
                        박서현 펫시터
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          서울 강남구
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배지들 */}
              <div className="absolute top-0 right-8 px-4 py-3 bg-white rounded-2xl shadow-lg flex items-center gap-2 z-20">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-stone-900 text-base font-bold">4.9</span>
              </div>
              <div className="absolute top-48 left-0 px-4 py-3 bg-white rounded-2xl shadow-lg z-20">
                <span className="text-gray-500 text-xs">인증 펫시터</span>
              </div>
              <div className="absolute bottom-8 right-8 px-4 py-2.5 bg-orange-500 rounded-2xl shadow-lg z-20">
                <span className="text-white text-sm font-medium">
                  즉시 예약 가능
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 종류 */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
                어떤 돌봄이 필요하신가요?
              </h2>
              <p className="text-gray-500 text-base mt-3">
                다양한 돌봄 서비스를 제공합니다
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
              {SERVICES.map(({ Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow cursor-pointer"
                >
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-orange-500" strokeWidth={2} />
                  </div>
                  <span className="text-stone-900 text-base font-semibold">
                    {label}
                  </span>
                  <span className="text-gray-500 text-sm mt-2 text-center">
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 내 주변 펫시터 */}
        <section className="py-16 md:py-20 bg-orange-50">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
                  내 주변 펫시터
                </h2>
                <span className="px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-500 text-xs font-medium">
                  서울 마포구
                </span>
              </div>
              <Link
                href="/petsitters"
                className="flex items-center gap-1 text-orange-500 text-base font-medium hover:opacity-80 transition-opacity"
              >
                더보기
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PETSITTERS.map((sitter) => (
                <PetsitterCard key={sitter.name} {...sitter} />
              ))}
            </div>
          </div>
        </section>

        {/* 이용 방법 */}
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
                    <h3 className="text-stone-900 text-lg font-semibold">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-base mt-2">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 신뢰 보장 */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-orange-500 via-orange-500 to-stone-600">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">
              안전한 거래를 보장합니다
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {TRUST_ITEMS.map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">
                    {title}
                  </h3>
                  <p className="text-white/80 text-base leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
