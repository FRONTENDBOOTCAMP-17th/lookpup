/**
 * 지원 목록에서의 거절 / 선택 확정 상태 관리.
 * useChatRooms의 applicants 참고.
 */
import { useState, useEffect, useRef } from "react";
import type { Applicant } from "@/components/common/chat/chat_components";

export function useRequest(applicants: Applicant[]) {
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // applicants가 처음 로드될 때 DB 상태로 초기화
  useEffect(() => {
    if (initializedRef.current || applicants.length === 0) return;
    initializedRef.current = true;

    const rejected = new Set<string>();
    let confirmed: string | null = null;
    applicants.forEach((a) => {
      if (a.applicationStatus === "rejected") rejected.add(a.id);
      if (a.applicationStatus === "selected") confirmed = a.id;
    });
    if (rejected.size > 0) setRejectedIds(rejected);
    if (confirmed !== null) setConfirmedId(confirmed);
  }, [applicants]);

  function rejectApplicant(id: string) {
    if (confirmedId === id || rejectedIds.has(id)) return;
    setRejectedIds((prev) => new Set(prev).add(id));
  }

  function confirmApplicant(id: string) {
    if (rejectedIds.has(id) || confirmedId !== null) return;
    setConfirmedId(id);

    const newRejected = new Set(rejectedIds);
    applicants.forEach((a) => {
      if (a.id !== id) newRejected.add(a.id);
    });
    setRejectedIds(newRejected);
  }

  function getApplicantBadge(id: string) {
    if (rejectedIds.has(id))
      return { label: "거절됨", className: "bg-stone-100 text-stone-400" };
    if (confirmedId === id)
      return { label: "선택됨", className: "bg-orange-50 text-orange-500" };
    const unread = applicants.find((a) => a.id === id)?.unread ?? 0;
    if (unread > 0)
      return {
        label: `새 메시지 ${unread}`,
        className: "bg-green-50 text-green-700",
      };
    return { label: "읽음", className: "bg-stone-100 text-stone-400" };
  }

  return {
    rejectedIds,
    confirmedId,
    rejectApplicant,
    confirmApplicant,
    getApplicantBadge,
  };
}
