import { Search, Calendar, MessageCircle, Star, MapPin } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    title: "위치 기반 매칭",
    desc: "현재 위치 또는 원하는 지역을 기준으로 가까운 펫시터를 우선 노출합니다.",
  },
  {
    icon: Search,
    title: "조건 맞춤 검색",
    desc: "서비스 유형, 가격대, 지역을 선택해 딱 맞는 펫시터를 빠르게 찾을 수 있습니다.",
  },
  {
    icon: Calendar,
    title: "실시간 예약 관리",
    desc: "달력으로 가능한 날짜를 바로 확인하고, 예약 확정부터 완료까지 단계별로 진행할 수 있습니다.",
  },
  {
    icon: MessageCircle,
    title: "1:1 채팅",
    desc: "예약 전후 언제든지 채팅으로 소통하고 돌봄 상황을 실시간으로 파악할 수 있습니다.",
  },
  {
    icon: Star,
    title: "검증된 후기",
    desc: "실제 예약을 완료한 보호자만 후기를 작성할 수 있어 신뢰할 수 있는 후기를 확인할 수 있습니다.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
          주요 기능
        </h2>
        <p className="text-gray-500 text-center mb-10 md:mb-14">
          봐주개가 제공하는 핵심 기능을 확인하세요
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
              <h3 className="text-stone-900 text-lg font-semibold">{title}</h3>
              <p className="text-gray-500 text-base leading-6">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
