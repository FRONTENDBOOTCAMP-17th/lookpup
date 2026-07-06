import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Home, User, Activity, Car } from "lucide-react";
import ScrollReveal from "@/components/common/ScrollReveal";

const SERVICES: { Icon: LucideIcon; label: string; desc: string; href: string }[] = [
  { Icon: Home, label: "방문돌봄", desc: "집에서 안전하게", href: "/board?category=방문돌봄" },
  { Icon: User, label: "위탁돌봄", desc: "펫시터 집에서", href: "/board?category=위탁돌봄" },
  { Icon: Activity, label: "산책", desc: "건강한 산책", href: "/board?category=산책" },
  { Icon: Car, label: "픽업", desc: "편리한 이동", href: "/board?category=픽업" },
];

export default function ServicesSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
            어떤 돌봄이 필요하신가요?
          </h2>
          <p className="text-gray-500 text-base mt-3">
            다양한 돌봄 서비스를 제공합니다
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5">
          {SERVICES.map(({ Icon, label, desc, href }, index) => (
            <ScrollReveal key={label} delay={index * 0.08}>
              <Link
                href={href}
                className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)] transition-shadow"
              >
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-orange-500" strokeWidth={2} />
                </div>
                <span className="text-stone-900 text-base font-semibold">{label}</span>
                <span className="text-gray-500 text-sm mt-2 text-center">{desc}</span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
