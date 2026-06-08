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

// 더미더미 데이터

const SERVICES: { Icon: LucideIcon; label: string; desc: string }[] = [
  { Icon: Home, label: "방문돌봄", desc: "집에서 안전하게" },
  { Icon: User, label: "위탁돌봄", desc: "펫시터 집에서" },
  { Icon: Activity, label: "산책", desc: "건강한 산책" },
  { Icon: Building, label: "펫호텔", desc: "프리미엄 케어" },
  { Icon: Car, label: "픽업", desc: "편리한 이동" },
];

const PETSITTERS = [
  { name: "김민지", initial: "김", district: "마포구", rating: 4.9, reviews: 47, price: "30,000", services: ["방문돌봄", "산책"], certified: true },
  { name: "이서연", initial: "이", district: "강남구", rating: 4.8, reviews: 32, price: "35,000", services: ["방문돌봄", "산책"], certified: false },
  { name: "박준호", initial: "박", district: "용산구", rating: 4.7, reviews: 28, price: "28,000", services: ["방문돌봄", "산책"], certified: false },
  { name: "최예진", initial: "최", district: "성동구", rating: 4.6, reviews: 15, price: "32,000", services: ["방문돌봄", "산책"], certified: false },
];

const STEPS = [
  { num: 1, title: "펫시터 검색", desc: "우리 동네 펫시터를 찾아보세요" },
  { num: 2, title: "예약 & 결제", desc: "간편하게 예약하고 안전하게 결제하세요" },
  { num: 3, title: "안심 돌봄", desc: "믿고 맡기는 반려동물 케어" },
];

const TRUST_ITEMS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Shield, title: "인증된 펫시터", desc: "신원확인과 자격증 검증을 거친 펫시터만 등록됩니다" },
  { Icon: CreditCard, title: "안전한 결제", desc: "에스크로 시스템으로 안전하게 거래하세요" },
  { Icon: MessageSquare, title: "실제 후기", desc: "검증된 이용자의 진짜 후기를 확인하세요" },
];

// 컴포넌트

function PetsitterCard({
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
    <div className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex flex-col gap-4 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center shrink-0">
          <span className="text-orange-500 text-xl font-semibold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-stone-900 text-base font-semibold">{name}</span>
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
          <span className="text-stone-900 text-sm font-bold">{rating.toFixed(1)}</span>
          <span className="text-gray-500 text-xs">({reviews})</span>
        </div>
        <span className="text-orange-500 text-sm font-semibold">{price}원~</span>
      </div>
    </div>
  );
}

// 페이지

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* 히어로 */}
        <section className="bg-gradient-to-b from-orange-50 via-stone-50/20 to-white py-12 md:py-16 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col items-center text-center">
              {/* 뱃지 */}
              <div className="inline-flex items-center px-3 py-1 bg-orange-50 rounded-full mb-6">
                <span className="text-orange-500 text-xs font-medium">
                  반려동물 돌봄 플랫폼 🐾
                </span>
              </div>

              {/* 타이틀 */}
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-6">
                우리 아이를{" "}
                <span className="text-orange-500">믿고 맡길 수 있는</span>
                <br />
                반려동물 돌봄 플랫폼
              </h1>

              {/* 서브타이틀 */}
              <p className="text-gray-500 text-base sm:text-lg leading-7 mb-8 sm:mb-10">
                지역 기반 검색으로 가까운 펫시터를 찾고,
                <br />
                안전한 예약과 결제까지 한 번에
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-10">
                <Link
                  href="/petsitters"
                  className="w-40 h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center justify-center transition-colors"
                >
                  펫시터 찾기
                </Link>
                <Link
                  href="/register/petsitter"
                  className="w-40 h-12 bg-white hover:bg-orange-50 text-orange-500 text-base font-semibold rounded-[10px] border border-orange-500 flex items-center justify-center transition-colors"
                >
                  펫시터 등록하기
                </Link>
              </div>

              {/* 통계 */}
              <div className="flex items-center gap-6 sm:gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-orange-500 text-2xl font-bold">5,200+</span>
                  <span className="text-gray-500 text-sm">펫시터</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-orange-500 text-2xl font-bold">98%</span>
                  <span className="text-gray-500 text-sm">만족도</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-stone-900 text-sm font-bold">안전 에스크로 결제</span>
                  <span className="text-gray-500 text-xs">보장된 거래</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 종류 */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
                어떤 돌봄이 필요하신가요?
              </h2>
              <p className="text-gray-500 text-base mt-3">다양한 돌봄 서비스를 제공합니다</p>
            </div>

            {/* 5개 카드: 모바일 2열(5번째 전체폭), md+ 3열 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {SERVICES.map(({ Icon, label, desc }, i) => (
                <div
                  key={label}
                  className={`flex flex-col items-center p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow cursor-pointer${
                    i === 4 ? " col-span-2 md:col-span-1" : ""
                  }`}
                >
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-orange-500" strokeWidth={2} />
                  </div>
                  <span className="text-stone-900 text-base font-semibold">{label}</span>
                  <span className="text-gray-500 text-sm mt-2 text-center">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 내 주변 펫시터 */}
        <section className="py-16 md:py-20 bg-orange-50">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-stone-900">내 주변 펫시터</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PETSITTERS.map((sitter) => (
                <PetsitterCard key={sitter.name} {...sitter} />
              ))}
            </div>
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 text-center mb-16">
              이용 방법
            </h2>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm flex flex-col gap-8">
                {STEPS.map(({ num, title, desc }) => (
                  <div key={num} className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {num}
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="text-stone-900 text-xl font-semibold">{title}</h3>
                      <p className="text-gray-500 text-base mt-2">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 안전 보장 */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-orange-500 via-orange-500 to-stone-600">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">
              안전한 거래를 보장합니다
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {TRUST_ITEMS.map(({ Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
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
