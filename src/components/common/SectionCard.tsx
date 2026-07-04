import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
