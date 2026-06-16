/**
 * 지원 목록에서의 거절 / 선택 확정 상태 관리.
 * useChatRooms의 applicants 참고.
 */
import { useState } from "react";
import type { Applicant } from "@/components/common/chat/chat_components";

export function useRequest(applicants: Applicant[]) {
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  // 채팅창에 표시되는 현 지원 상태 안내 문구를 지원자 ID키로 저장
  const [sysMessages, setSysMessages] = useState<Record<string, string>>({});

  function rejectApplicant(id: string) {
    if (confirmedId === id || rejectedIds.has(id)) return;
    setRejectedIds((prev) => new Set(prev).add(id));
    const name = applicants.find((a) => a.id === id)?.name ?? "";
    setSysMessages((prev) => ({ ...prev, [id]: `${name}님을 거절했습니다` }));
  }

  function confirmApplicant(id: string) {
    if (rejectedIds.has(id) || confirmedId !== null) return;
    setConfirmedId(id);

    const newRejected = new Set(rejectedIds);
    const newMessages: Record<string, string> = { ...sysMessages };
    applicants.forEach((a) => {
      if (a.id !== id) {
        newRejected.add(a.id);
        newMessages[a.id] = `${a.name}님을 거절했습니다`;
      }
    });
    setRejectedIds(newRejected);
    const confirmedName = applicants.find((a) => a.id === id)?.name ?? "";
    newMessages[id] = `${confirmedName}님을 선택 확정했습니다 🎉`;
    setSysMessages(newMessages);
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
    sysMessages,
    rejectApplicant,
    confirmApplicant,
    getApplicantBadge,
  };
}
