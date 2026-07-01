"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SelectableSitter {
  id: string;
  city: string;
  district: string;
  neighborhood: string;
}

export function useSitterSelection(sitters: SelectableSitter[], urlSelected: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedSitterId, setSelectedSitterId] = useState<string | null>(urlSelected || null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 선택된 시터 URL 반영
  useEffect(() => {
    if (!selectedSitterId) return;
    const sitter = sitters.find((s) => s.id === selectedSitterId);
    if (!sitter) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", selectedSitterId);
    if (sitter.city) params.set("sel_city", sitter.city);
    else params.delete("sel_city");
    if (sitter.district) params.set("sel_district", sitter.district);
    else params.delete("sel_district");
    if (sitter.neighborhood) params.set("sel_dong", sitter.neighborhood);
    else params.delete("sel_dong");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSitterId]);

  // 카드 스크롤 동기화
  useEffect(() => {
    if (selectedSitterId === null) return;
    const card = cardRefs.current.get(selectedSitterId);
    if (!card) return;
    const viewport = card.closest<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    viewport.scrollTo({
      top: viewport.scrollTop + cardRect.top - viewportRect.top - 20,
      behavior: "smooth",
    });
  }, [selectedSitterId]);

  function registerCardRef(id: string, el: HTMLDivElement | null) {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }

  return { selectedSitterId, setSelectedSitterId, registerCardRef };
}
