import { MapPin, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import { useUserStore } from "@/store/userStore";

export interface SitterProfile {
  name: string;
  initial: string;
  src?: string | null;
  verified: boolean;
  location: string;
  rating: number;
  reviewCount: number;
  services: string[];
  career: string;
  completedCount: string;
}

interface Props {
  profile?: SitterProfile;
  className?: string;
}

export default function SitterProfileCard({ profile, className = "" }: Props) {
  const { user, sitter } = useUserStore();
  console.log(sitter);
  const p: SitterProfile | null =
    profile ??
    (user && sitter
      ? {
          name: user.fullName,
          initial: user.fullName.charAt(0),
          src: user.profileImage,
          verified: user.isVerified,
          location: sitter.availableArea,
          rating: sitter.rating,
          reviewCount: sitter.reviewCount,
          services: sitter.services,
          career: sitter.career ?? "-",
          completedCount: `${sitter.reviewCount}건`,
        }
      : null);

  if (!p) return null;

  return (
    <div
      className={`bg-white border border-orange-100 rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)] overflow-hidden ${className}`}
    >
      <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-300" />

      <div className="p-5 space-y-4">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <Avatar
              initial={p.initial}
              src={p.src}
              size="lg"
              variant="orange"
            />
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
              <span className="text-sm font-bold text-stone-900">
                {p.rating}
              </span>
              <span className="text-xs text-gray-400">
                ({p.reviewCount}개 리뷰)
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {p.services.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>

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
