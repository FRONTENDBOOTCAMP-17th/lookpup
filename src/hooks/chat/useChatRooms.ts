/**
 * 채팅 목록 전체 관리.
 * direct와 request 두 타입을 room_type으로 분리하고 각각 저장함!
 * rooms : 1:1 채팅 / applicants : 지원 목록 채팅
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomApiItem } from "@/app/actions/chat";
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
  SERVICE_COMPLETE_CONFIRMED_PREFIX,
  SERVICE_START_PREFIX,
  RESERVATION_REQUEST_PREFIX,
  RESERVATION_ACCEPTED_PREFIX,
  RESERVATION_REJECTED_PREFIX,
  RESERVATION_EDIT_PREFIX,
  RESERVATION_EDIT_RESPONSE_PREFIX,
  truncatePreview,
} from "@/lib/chatMessagePrefixes";

function isReservationStatusChangeMessage(content: string): boolean {
  return (
    content.startsWith(SERVICE_COMPLETE_CONFIRMED_PREFIX) ||
    content.startsWith(RESERVATION_CANCELED_PREFIX) ||
    content.startsWith(SERVICE_START_PREFIX) ||
    content.startsWith(RESERVATION_EDIT_RESPONSE_PREFIX)
  );
}

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
  createdAt: string | null;
}

function formatRoomSub(r: RoomApiItem, fallback = "1:1 채팅"): string {
  if (r.request_title) return r.request_title;
  if (!r.reservation_service_title && r.reservation_pet_names.length === 0) {
    return fallback;
  }
  const date = r.reservation_start_datetime
    ? new Date(r.reservation_start_datetime).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
      })
    : null;
  const parts = [
    r.reservation_service_title,
    r.reservation_pet_names.join(", ") || null,
    date,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallback;
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
  if (content.startsWith(SERVICE_COMPLETE_CONFIRMED_PREFIX))
    return "서비스 완료 확정";
  if (content.startsWith(SERVICE_COMPLETE_PREFIX)) return "서비스 완료";
  if (content.startsWith(SERVICE_START_PREFIX)) return "서비스 시작";
  if (content.startsWith(RESERVATION_REQUEST_PREFIX)) return "예약 요청";
  if (content.startsWith(RESERVATION_ACCEPTED_PREFIX)) return "예약 확정";
  if (content === RESERVATION_REJECTED_PREFIX) return "예약 거절";
  if (content.startsWith(RESERVATION_EDIT_PREFIX)) return "예약 수정 요청";
  if (content.startsWith(RESERVATION_EDIT_RESPONSE_PREFIX)) {
    try {
      const payload = JSON.parse(
        content.slice(RESERVATION_EDIT_RESPONSE_PREFIX.length),
      );
      return payload.accepted ? "예약 수정 승인" : "예약 수정 거절";
    } catch {
      return "예약 수정 응답";
    }
  }
  return truncatePreview(content);
}

function transformRoomsData(data: RoomApiItem[]): {
  rooms: ChatRoom[];
  applicants: Applicant[];
  reservationRequests: ReservationRequest[];
  posts: Post[];
} {
  const directRooms = data
    .filter((r) => r.room_type === "direct")
    .map((r) => ({
      id: r.id,
      ownerId: r.owner_id ?? null,
      sitterId: r.sitter_id ?? null,
      reservationId: r.reservation_id ?? null,
      reservationStatus: r.reservation_status ?? null,
      name: r.other_user_full_name ?? "",
      initial: (r.other_user_full_name ?? "?")[0],
      profileImage: r.other_user_profile_image ?? null,
      sub: formatRoomSub(r),
      lastMessage: formatPreview(r.last_message ?? ""),
      time: formatTime(r.last_message_at),
      unread: r.unread_count ?? 0,
      recipientLeft: r.recipient_left,
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
    rating: r.sitter_rating ?? 0,
    preview: formatPreview(r.last_message ?? ""),
    time: formatTime(r.last_message_at),
    unread: r.unread_count ?? 0,
    applicationStatus: r.application_status ?? null,
    recipientLeft: r.recipient_left,
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
      rating: r.sitter_rating ?? 0,
      sub: formatRoomSub(r, "예약 요청"),
      preview: formatPreview(r.last_message ?? ""),
      time: formatTime(r.last_message_at),
      unread: r.unread_count ?? 0,
      reservationStatus: r.reservation_status ?? null,
      recipientLeft: r.recipient_left,
    }));

  const seen = new Set<string>();
  const posts: Post[] = [];
  for (const r of requestRooms) {
    if (r.request_id && !seen.has(r.request_id)) {
      seen.add(r.request_id);
      posts.push({
        id: r.request_id,
        title: r.request_title ?? "구인글",
        status: r.request_status ?? "open",
        createdAt: r.request_created_at ?? null,
      });
    }
  }
  posts.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return {
    rooms: directRooms,
    applicants: applicantList,
    reservationRequests: reservationRequestList,
    posts,
  };
}

export function useChatRooms(
  activeRoomId: string | null,
  initialData?: RoomApiItem[],
) {
  const [initialTransformed] = useState(() =>
    initialData ? transformRoomsData(initialData) : null,
  );
  const [rooms, setRooms] = useState<ChatRoom[]>(
    initialTransformed?.rooms ?? [],
  );
  const [applicants, setApplicants] = useState<Applicant[]>(
    initialTransformed?.applicants ?? [],
  );
  const [reservationRequests, setReservationRequests] = useState<
    ReservationRequest[]
  >(initialTransformed?.reservationRequests ?? []);
  const [posts, setPosts] = useState<Post[]>(initialTransformed?.posts ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptedDirectRoomId, setAcceptedDirectRoomId] = useState<
    string | null
  >(null);

  const activeRoomIdRef = useRef(activeRoomId);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const myRoomIdsRef = useRef(new Set<string>());
  const reservationRequestIdsRef = useRef(new Set<string>());

  const broadcastChannelsRef = useRef<RealtimeChannel[]>([]);
  const broadcastSupabaseRef = useRef<ReturnType<typeof createClient> | null>(
    null,
  );
  const subscribedRoomIdsRef = useRef(new Set<string>());

  useEffect(() => {
    myRoomIdsRef.current = new Set([
      ...rooms.map((r) => r.id),
      ...applicants.map((a) => a.id),
      ...reservationRequests.map((rr) => rr.id),
    ]);
  }, [rooms, applicants, reservationRequests]);

  useEffect(() => {
    reservationRequestIdsRef.current = new Set(
      reservationRequests.map((rr) => rr.id),
    );
  }, [reservationRequests]);

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

      const transformed = transformRoomsData(data);
      setRooms(transformed.rooms);
      setApplicants(transformed.applicants);
      setReservationRequests(transformed.reservationRequests);
      setPosts(transformed.posts);
    } catch (err) {
      if (!silent) setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const updateRoomPreview = useCallback(
    (roomId: string, content: string, createdAt: string) => {
      const time = formatTime(createdAt);
      const preview = truncatePreview(content);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId ? { ...r, lastMessage: preview, time } : r,
        ),
      );
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === roomId ? { ...a, preview, time } : a,
        ),
      );
      setReservationRequests((prev) =>
        prev.map((rr) =>
          rr.id === roomId ? { ...rr, preview, time } : rr,
        ),
      );
    },
    [],
  );

  const incrementUnread = useCallback((roomId: string) => {
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
  }, []);

  useEffect(() => {
    if (initialData) return;
    // 초기 데이터가 없을 때 서버에서 채팅방 목록을 fetch하는 함수라 effect가 맞는 위치
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, [fetchRooms, initialData]);

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
        (payload) => {
          fetchRooms(true);
          const newRoom = payload.new as { id?: string; room_type?: string };
          if (newRoom?.room_type === "direct" && newRoom.id) {
            setAcceptedDirectRoomId(newRoom.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_rooms",
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as { id?: string; room_type?: string };
          if (
            updated?.room_type === "direct" &&
            updated.id &&
            reservationRequestIdsRef.current.has(updated.id)
          ) {
            fetchRooms(true);
            setAcceptedDirectRoomId(updated.id);
          }
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

          if (isReservationStatusChangeMessage(content)) {
            fetchRooms(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRooms]);

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

          // 예약 상태(reservation_status)가 바뀌었을 수 있으므로 목록을 다시 불러옴
          if (isReservationStatusChangeMessage(m.content)) {
            fetchRooms(true);
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

  const deleteRoom = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      const res = await fetch(`/api/chat/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body?.error?.message ?? "채팅방 나가기에 실패했습니다." };
      }
      setRooms((prev) => prev.filter((r) => r.id !== id));
      return {};
    },
    [],
  );

  const deleteApplicant = useCallback(
    async (id: string): Promise<{ error?: string }> => {
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
    },
    [applicants],
  );

  const updateApplicantStatus = useCallback((roomId: string, status: string) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === roomId ? { ...a, applicationStatus: status } : a,
      ),
    );
  }, []);

  const deleteReservationRequest = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      const res = await fetch(`/api/chat/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body?.error?.message ?? "채팅방 나가기에 실패했습니다." };
      }
      setReservationRequests((prev) => prev.filter((rr) => rr.id !== id));
      return {};
    },
    [],
  );

  const updateReservationRequestStatus = useCallback(
    (roomId: string, status: string) => {
      setReservationRequests((prev) =>
        prev.map((rr) =>
          rr.id === roomId ? { ...rr, reservationStatus: status } : rr,
        ),
      );
    },
    [],
  );

  const refresh = useCallback(() => fetchRooms(true), [fetchRooms]);

  const clearAcceptedDirectRoomId = useCallback(
    () => setAcceptedDirectRoomId(null),
    [],
  );

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
    clearAcceptedDirectRoomId,
  };
}
