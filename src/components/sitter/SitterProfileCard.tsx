import { MapPin, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";

export interface SitterProfile {
  name: string;
  initial: string;
  verified: boolean;
  location: string;
  rating: number;
  reviewCount: number;
  services: string[];
  career: string;
  completedCount: string;
}

interface Props {
  profile: SitterProfile;
  className?: string;
}

/**
 * 펫시터 요약 카드.
 * 채팅·프리뷰 등 여러 곳에서 재사용.
 * 프로필 보기 / 수정하기 / 삭제 버튼, 응답률은 포함하지 않음.
 */
export default function SitterProfileCard({ profile: p, className = "" }: Props) {
  return (
    <div
      className={`bg-white border border-orange-100 rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)] overflow-hidden ${className}`}
    >
      {/* 상단 그라디언트 바 */}
      <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-300" />

      <div className="p-5 space-y-4">
        {/* 프로필 헤더 */}
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <Avatar initial={p.initial} size="lg" variant="orange" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-stone-900">{p.name}</span>
              {p.verified && (
                <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[10px] font-medium">
                  인증
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">{p.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-stone-900">{p.rating}</span>
              <span className="text-xs text-gray-400">({p.reviewCount}개 리뷰)</span>
            </div>
          </div>
        </div>

        {/* 서비스 태그 */}
        <div className="flex gap-2 flex-wrap">
          {p.services.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>

        {/* 경력 / 완료 건수 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "경력", value: p.career },
            { label: "완료 건수", value: p.completedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-orange-50 rounded-xl px-3 py-2.5 text-center"
            >
              <p className="text-sm font-bold text-orange-500">{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
