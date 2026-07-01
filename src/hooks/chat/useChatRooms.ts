/**
 * 채팅 목록 전체 관리.
 * direct와 request 두 타입을 room_type으로 분리하고 각각 저장함!
 * rooms : 1:1 채팅 / applicants : 지원 목록 채팅
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  ChatRoom,
  Applicant,
  ReservationRequest,
} from "@/components/common/chat/chat_components";
import {
  SYSTEM_MSG_PREFIX,
  IMAGE_MSG_PREFIX,
  PAYMENT_REQUEST_PREFIX,
  PAYMENT_COMPLETE_PREFIX,
  APPLICATION_SELECTED_PREFIX,
  APPLICATION_REJECTED_PREFIX,
  RESERVATION_CANCELED_PREFIX,
  SERVICE_COMPLETE_PREFIX,
  SERVICE_START_PREFIX,
  RESERVATION_REQUEST_PREFIX,
  RESERVATION_ACCEPTED_PREFIX,
  RESERVATION_REJECTED_PREFIX,
  RESERVATION_EDIT_PREFIX,
  RESERVATION_EDIT_RESPONSE_PREFIX,
} from "@/lib/chatMessagePrefixes";

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface Post {
  id: string;
  title: string;
  status: string;
}

interface RoomApiItem {
  id: string;
  room_type: "direct" | "request" | "reservation_request";
  owner_id: string | null;
  sitter_id: string | null;
  reservation_id: string | null;
  other_user_full_name: string | null;
  other_user_profile_image: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number | null;
  request_id: string | null;
  request_title: string | null;
  request_status: string | null;
  application_status: string | null;
  reservation_status: string | null;
}

function formatPreview(content: string): string {
  if (content.startsWith(SYSTEM_MSG_PREFIX))
    return content.slice(SYSTEM_MSG_PREFIX.length);
  if (content.startsWith(IMAGE_MSG_PREFIX)) return "사진";
  if (content.startsWith(PAYMENT_REQUEST_PREFIX)) return "결제 요청";
  if (content.startsWith(PAYMENT_COMPLETE_PREFIX)) return "결제 완료";
  if (content.startsWith(APPLICATION_SELECTED_PREFIX)) return "선택 확정";
  if (content.startsWith(APPLICATION_REJECTED_PREFIX)) return "지원 거절";
  if (content.startsWith(RESERVATION_CANCELED_PREFIX)) return "예약 취소";
  if (content.startsWith(SERVICE_COMPLETE_PREFIX)) return "서비스 완료";
  if (content.startsWith(SERVICE_START_PREFIX)) return "서비스 시작";
  if (content.startsWith(RESERVATION_REQUEST_PREFIX)) return "예약 요청";
  if (content.startsWith(RESERVATION_ACCEPTED_PREFIX)) return "예약 확정";
  if (content === RESERVATION_REJECTED_PREFIX) return "예약 거절";
  if (content.startsWith(RESERVATION_EDIT_PREFIX)) return "예약 수정 요청";
  if (content.startsWith(RESERVATION_EDIT_RESPONSE_PREFIX)) {
    try {
      const payload = JSON.parse(content.slice(RESERVATION_EDIT_RESPONSE_PREFIX.length));
      return payload.accepted ? "예약 수정 승인" : "예약 수정 거절";
    } catch {
      return "예약 수정 응답";
    }
  }
  return content;
}

export function useChatRooms(activeRoomId: string | null) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [reservationRequests, setReservationRequests] = useState<
    ReservationRequest[]
  >([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptedDirectRoomId, setAcceptedDirectRoomId] = useState<string | null>(null);

  const activeRoomIdRef = useRef(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const myRoomIdsRef = useRef(new Set<string>());

  const broadcastChannelsRef = useRef<RealtimeChannel[]>([]);
  const broadcastSupabaseRef = useRef<ReturnType<typeof createClient> | null>(
    null,
  );
  const subscribedRoomIdsRef = useRef(new Set<string>());

  myRoomIdsRef.current = new Set([
    ...rooms.map((r) => r.id),
    ...applicants.map((a) => a.id),
    ...reservationRequests.map((rr) => rr.id),
  ]);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/chat/rooms");
      if (!res.ok) throw new Error("채팅 목록을 불러오지 못했습니다");
      const { data }: { data: RoomApiItem[] } = await res.json();

      const directRooms = data
        .filter((r) => r.room_type === "direct")
        .map((r) => ({
          id: r.id,
          ownerId: r.owner_id ?? null,
          sitterId: r.sitter_id ?? null,
          reservationId: r.reservation_id ?? null,
          name: r.other_user_full_name ?? "",
          initial: (r.other_user_full_name ?? "?")[0],
          profileImage: r.other_user_profile_image ?? null,
          sub: r.request_title ?? "예약 채팅",
          lastMessage: formatPreview(r.last_message ?? ""),
          time: formatTime(r.last_message_at),
          unread: r.unread_count ?? 0,
        }));

      const requestRooms = data.filter((r) => r.room_type === "request");
      const applicantList = requestRooms.map((r) => ({
        id: r.id,
        sitterId: r.sitter_id ?? null,
        ownerId: r.owner_id ?? null,
        postId: r.request_id ?? "",
        name: r.other_user_full_name ?? "",
        initial: (r.other_user_full_name ?? "?")[0],
        profileImage: r.other_user_profile_image ?? null,
        rating: 0,
        preview: formatPreview(r.last_message ?? ""),
        unread: r.unread_count ?? 0,
        applicationStatus: r.application_status ?? null,
      }));

      const reservationRequestList = data
        .filter((r) => r.room_type === "reservation_request")
        .map((r) => ({
          id: r.id,
          sitterId: r.sitter_id ?? null,
          ownerId: r.owner_id ?? null,
          reservationId: r.reservation_id ?? null,
          name: r.other_user_full_name ?? "",
          initial: (r.other_user_full_name ?? "?")[0],
          profileImage: r.other_user_profile_image ?? null,
          preview: formatPreview(r.last_message ?? ""),
          time: formatTime(r.last_message_at),
          unread: r.unread_count ?? 0,
          reservationStatus: r.reservation_status ?? null,
        }));

      setRooms(directRooms);
      setApplicants(applicantList);
      setReservationRequests(reservationRequestList);

      const seen = new Set<string>();
      const derivedPosts: Post[] = [];
      for (const r of requestRooms) {
        if (r.request_id && !seen.has(r.request_id)) {
          seen.add(r.request_id);
          derivedPosts.push({
            id: r.request_id,
            title: r.request_title ?? "구인글",
            status: r.request_status ?? "open",
          });
        }
      }
      setPosts(derivedPosts);
    } catch (err) {
      if (!silent) setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("new-rooms-tracker")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_rooms",
          filter: `sitter_id=eq.${userId}`,
        },
        () => {
          fetchRooms(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_rooms",
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          fetchRooms(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRooms]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("unread-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const { room_id, content, created_at } = payload.new as {
            room_id: string;
            content: string;
            created_at: string;
          };

          if (!myRoomIdsRef.current.has(room_id)) return;
          updateRoomPreview(room_id, formatPreview(content), created_at);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const allIds = [
      ...rooms.map((r) => r.id),
      ...applicants.map((a) => a.id),
      ...reservationRequests.map((rr) => rr.id),
    ];
    const newIds = allIds.filter((id) => !subscribedRoomIdsRef.current.has(id));
    if (newIds.length === 0) return;

    if (!broadcastSupabaseRef.current) {
      broadcastSupabaseRef.current = createClient();
    }
    const supabase = broadcastSupabaseRef.current;

    newIds.forEach((roomId) => {
      subscribedRoomIdsRef.current.add(roomId);
      const ch = supabase
        .channel(`room-${roomId}`)
        .on("broadcast", { event: "new_message" }, ({ payload }) => {
          const m = payload as {
            sender_id: string;
            content: string;
            created_at: string;
          };
          updateRoomPreview(roomId, formatPreview(m.content), m.created_at);

          if (
            m.sender_id !== userIdRef.current &&
            roomId !== activeRoomIdRef.current
          ) {
            incrementUnread(roomId);
          }
        })
        .on("broadcast", { event: "application_confirmed" }, () => {
          setApplicants((prev) =>
            prev.map((a) =>
              a.id === roomId ? { ...a, applicationStatus: "selected" } : a,
            ),
          );
        })
        .on("broadcast", { event: "reservation_accepted" }, ({ payload }) => {
          fetchRooms(true);
          const roomId = (payload as { room_id?: string }).room_id;
          if (roomId) setAcceptedDirectRoomId(roomId);
        })
        .subscribe();
      broadcastChannelsRef.current.push(ch);
    });
  }, [rooms, applicants, userId]);

  useEffect(() => {
    return () => {
      const supabase = broadcastSupabaseRef.current;
      if (supabase) {
        broadcastChannelsRef.current.forEach((ch) =>
          supabase.removeChannel(ch),
        );
      }
    };
  }, []);

  function updateRoomPreview(
    roomId: string,
    content: string,
    createdAt: string,
  ) {
    const time = formatTime(createdAt);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, lastMessage: content, time } : r,
      ),
    );
    setApplicants((prev) =>
      prev.map((a) => (a.id === roomId ? { ...a, preview: content } : a)),
    );
    setReservationRequests((prev) =>
      prev.map((rr) =>
        rr.id === roomId ? { ...rr, preview: content, time } : rr,
      ),
    );
  }

  function incrementUnread(roomId: string) {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: r.unread + 1 } : r)),
    );
    setApplicants((prev) =>
      prev.map((a) => (a.id === roomId ? { ...a, unread: a.unread + 1 } : a)),
    );
    setReservationRequests((prev) =>
      prev.map((rr) =>
        rr.id === roomId ? { ...rr, unread: rr.unread + 1 } : rr,
      ),
    );
  }

  const markRoomAsRead = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r)),
    );
    setApplicants((prev) =>
      prev.map((a) => (a.id === roomId ? { ...a, unread: 0 } : a)),
    );
    setReservationRequests((prev) =>
      prev.map((rr) => (rr.id === roomId ? { ...rr, unread: 0 } : rr)),
    );
  }, []);

  async function deleteRoom(id: string): Promise<{ error?: string }> {
    const res = await fetch(`/api/chat/rooms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message ?? "채팅방 나가기에 실패했습니다." };
    }
    setRooms((prev) => prev.filter((r) => r.id !== id));
    return {};
  }

  async function deleteApplicant(id: string): Promise<{ error?: string }> {
    const applicant = applicants.find((a) => a.id === id);
    const res = await fetch(`/api/chat/rooms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message ?? "채팅방 나가기에 실패했습니다." };
    }
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    if (applicant) {
      const remaining = applicants.filter(
        (a) => a.id !== id && a.postId === applicant.postId,
      );
      if (remaining.length === 0) {
        setPosts((prev) => prev.filter((p) => p.id !== applicant.postId));
      }
    }
    return {};
  }

  function updateApplicantStatus(roomId: string, status: string) {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === roomId ? { ...a, applicationStatus: status } : a,
      ),
    );
  }

  async function deleteReservationRequest(
    id: string,
  ): Promise<{ error?: string }> {
    const res = await fetch(`/api/chat/rooms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message ?? "채팅방 나가기에 실패했습니다." };
    }
    setReservationRequests((prev) => prev.filter((rr) => rr.id !== id));
    return {};
  }

  function updateReservationRequestStatus(roomId: string, status: string) {
    setReservationRequests((prev) =>
      prev.map((rr) =>
        rr.id === roomId ? { ...rr, reservationStatus: status } : rr,
      ),
    );
  }

  const refresh = useCallback(() => fetchRooms(true), [fetchRooms]);

  return {
    rooms,
    applicants,
    reservationRequests,
    posts,
    loading,
    error,
    userId,
    deleteRoom,
    deleteApplicant,
    deleteReservationRequest,
    markRoomAsRead,
    updatePreview: updateRoomPreview,
    updateApplicantStatus,
    updateReservationRequestStatus,
    refresh,
    acceptedDirectRoomId,
    clearAcceptedDirectRoomId: () => setAcceptedDirectRoomId(null),
  };
}
