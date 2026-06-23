import Image from "next/image";
import { Camera } from "lucide-react";
import type { ReactNode } from "react";

interface AvatarProps {
  initial: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "dark" | "orange" | "blue";
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
  xl: "w-16 h-16 text-2xl",
  "2xl": "w-24 h-24 text-xl",
};

const VARIANT: Record<NonNullable<AvatarProps["variant"]>, { container: string; text: string }> = {
  default: { container: "bg-[#FFF0E8] border-2 border-[#FFE9D6]", text: "text-[#E8742A]" },
  dark: { container: "bg-orange-100", text: "text-[#E8742A]" },
  orange: { container: "bg-orange-50 border border-orange-100", text: "text-orange-500" },
  blue: { container: "bg-[#aed6f1]", text: "text-white" },
};

interface AvatarMobileProps {
  initial: string;
  src?: string | null;
  className?: string;
}

export function AvatarMobile({ initial, src, className = "" }: AvatarMobileProps) {
  return (
    <div
      className={`relative w-16 h-16 bg-white/30 rounded-full border-2 border-white flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {src ? (
        <Image src={src} alt={initial} fill className="object-cover" sizes="64px" />
      ) : (
        <span className="text-white text-2xl font-semibold">{initial}</span>
      )}
    </div>
  );
}

interface AvatarWithCameraProps {
  initial: string;
  variant?: AvatarProps["variant"];
  onCameraClick?: () => void;
  className?: string;
}

export function AvatarWithCamera({
  initial,
  variant = "default",
  onCameraClick,
  className = "",
}: AvatarWithCameraProps) {
  return (
    <div className={`relative ${className}`}>
      <Avatar initial={initial} size="2xl" variant={variant} />
      <button
        type="button"
        onClick={onCameraClick}
        className="absolute bottom-0 right-0 size-8 bg-[#E8742A] rounded-full flex justify-center items-center"
      >
        <Camera className="size-4 text-white" />
      </button>
    </div>
  );
}

interface AvatarReportProps {
  initial: string;
  src?: string | null;
  badge: ReactNode;
  className?: string;
}

export function AvatarReport({
  initial,
  src,
  badge,
  className = "",
}: AvatarReportProps) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <Avatar initial={initial} src={src} size="lg" variant="blue" />
      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#e8742a] flex items-center justify-center">
        {badge}
      </div>
    </div>
  );
}

export default function Avatar({
  initial,
  src,
  size = "md",
  variant = "default",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`relative ${SIZE[size]} ${VARIANT[variant].container} rounded-full flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {src ? (
        <Image src={src} alt={initial} fill className="object-cover" sizes="128px" />
      ) : (
        <span className={`${VARIANT[variant].text} font-semibold`}>{initial}</span>
      )}
    </div>
  );
}
