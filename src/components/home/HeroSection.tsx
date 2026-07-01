import { MapPin, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import HeroButtons from "@/components/home/HeroButtons";

export default function HeroSection() {
  return (
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

          <HeroButtons />

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
                    <span className="text-gray-500 text-sm">서울 마포구</span>
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
                    <span className="text-gray-500 text-sm">서울 강남구</span>
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
  );
}
