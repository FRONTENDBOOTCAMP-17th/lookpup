import type { LucideIcon } from "lucide-react";
import { Shield, CreditCard, MessageSquare } from "lucide-react";
import ScrollReveal from "@/components/common/ScrollReveal";

const TRUST_ITEMS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Shield, title: "인증된 펫시터", desc: "승인을 거친 펫시터만 등록됩니다" },
  { Icon: CreditCard, title: "안전한 결제", desc: "에스크로 시스템으로 안전하게 거래하세요" },
  { Icon: MessageSquare, title: "실제 후기", desc: "검증된 이용자의 진짜 후기를 확인하세요" },
];

export default function TrustSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-orange-500 via-orange-500 to-stone-600">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">
            안전한 거래를 보장합니다
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {TRUST_ITEMS.map(({ Icon, title, desc }, index) => (
            <ScrollReveal key={title} delay={index * 0.1}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
                <p className="text-white/80 text-base leading-6">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
