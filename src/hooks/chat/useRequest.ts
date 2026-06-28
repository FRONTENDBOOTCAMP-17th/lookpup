/**
 * 지원 목록에서의 거절 / 선택 확정 상태 관리.
 * useChatRooms의 applicants 참고.
 */
import { useState, useEffect } from "react";
import type { Applicant } from "@/components/common/chat/chat_components";

export function useRequest(applicants: Applicant[]) {
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (applicants.length === 0) return;

    setRejectedIds((prev) => {
      const toAdd = applicants.filter(
        (a) => a.applicationStatus === "rejected" && !prev.has(a.id),
      );
      if (toAdd.length === 0) return prev;
      const next = new Set(prev);
      toAdd.forEach((a) => next.add(a.id));
      return next;
    });

    setConfirmedIds((prev) => {
      const toAdd = applicants.filter(
        (a) =>
          a.applicationStatus === "selected" && prev.get(a.postId) !== a.id,
      );
      if (toAdd.length === 0) return prev;
      const next = new Map(prev);
      toAdd.forEach((a) => next.set(a.postId, a.id));
      return next;
    });
  }, [applicants]);

  function rejectApplicant(id: string) {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;
    if (confirmedIds.get(applicant.postId) === id || rejectedIds.has(id))
      return;
    setRejectedIds((prev) => new Set(prev).add(id));
  }

  function confirmApplicant(id: string) {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;
    const postId = applicant.postId;
    if (rejectedIds.has(id) || confirmedIds.has(postId)) return;

    setConfirmedIds((prev) => new Map(prev).set(postId, id));

    const newRejected = new Set(rejectedIds);
    applicants.forEach((a) => {
      if (a.postId === postId && a.id !== id) newRejected.add(a.id);
    });
    setRejectedIds(newRejected);
  }

  function getApplicantBadge(id: string) {
    if (rejectedIds.has(id))
      return { label: "거절됨", className: "bg-stone-100 text-stone-400" };
    const applicant = applicants.find((a) => a.id === id);
    if (applicant && confirmedIds.get(applicant.postId) === id)
      return { label: "선택됨", className: "bg-orange-50 text-orange-500" };
    const unread = applicant?.unread ?? 0;
    if (unread > 0)
      return {
        label: `새 메시지 ${unread}`,
        className: "bg-green-50 text-green-700",
      };
    return { label: "읽음", className: "bg-stone-100 text-stone-400" };
  }

  return {
    rejectedIds,
    confirmedIds,
    rejectApplicant,
    confirmApplicant,
    getApplicantBadge,
  };
}
