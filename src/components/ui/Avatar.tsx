interface AvatarProps {
  initial: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark";
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
  xl: "w-16 h-16 text-2xl",
};

const VARIANT: Record<NonNullable<AvatarProps["variant"]>, string> = {
  default: "bg-[#FFF0E8] border border-[#FFE9D6]",
  dark: "bg-orange-100",
};

interface AvatarMobileProps {
  initial: string;
  className?: string;
}

export function AvatarMobile({ initial, className = "" }: AvatarMobileProps) {
  return (
    <div
      className={`w-16 h-16 bg-white/30 rounded-full border-2 border-white flex items-center justify-center shrink-0 ${className}`}
    >
      <span className="text-white text-2xl font-semibold">{initial}</span>
    </div>
  );
}

export default function Avatar({
  initial,
  size = "md",
  variant = "default",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`${SIZE[size]} ${VARIANT[variant]} rounded-full flex items-center justify-center shrink-0 ${className}`}
    >
      <span className="text-[#E8742A] font-semibold">{initial}</span>
    </div>
  );
}
