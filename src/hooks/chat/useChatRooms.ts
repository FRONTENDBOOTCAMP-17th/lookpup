/**
 * 채팅 목록 전체 관리.
 * direct와 request 두 타입을 room_type으로 분리하고 각각 저장함!
 * rooms : 1:1 채팅 / applicants : 지원 목록 채팅
 *
 * 방 삭제하는 것 나중에 추가해야 함...확인할 것.
 * 지금의 deleteRoom / deleteApplicant는 클라이언트 목록에서만 제거함.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  ChatRoom,
  Applicant,
} from "@/components/common/chat/chat_components";

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
  room_type: "direct" | "request";
  owner_id: string | null;
  sitter_id: string | null;
  other_user_full_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number | null;
  request_id: string | null;
  request_title: string | null;
  request_status: string | null;
}

export function useChatRooms(activeRoomId: string | null) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
  ]);

  // 현재 로그인한 유저 ID 가져오기
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((res) => {
        if (!res.ok) throw new Error("채팅 목록을 불러오지 못했습니다");
        return res.json();
      })
      .then(({ data }: { data: RoomApiItem[] }) => {
        const directRooms = data
          .filter((r) => r.room_type === "direct")
          .map((r) => ({
            id: r.id,
            sitterId: r.sitter_id ?? null,
            name: r.other_user_full_name ?? "",
            initial: (r.other_user_full_name ?? "?")[0],
            sub: "1:1 채팅",
            lastMessage: r.last_message ?? "",
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
          rating: 0,
          preview: r.last_message ?? "",
          unread: r.unread_count ?? 0,
        }));

        setRooms(directRooms);
        setApplicants(applicantList);

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
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("unread-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const { room_id, sender_id, content, created_at } = payload.new as {
            room_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          if (sender_id !== userIdRef.current) return;
          if (!myRoomIdsRef.current.has(room_id)) return;
          updateRoomPreview(room_id, content, created_at);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const allIds = [...rooms.map((r) => r.id), ...applicants.map((a) => a.id)];
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
          updateRoomPreview(roomId, m.content, m.created_at);

          if (
            m.sender_id !== userIdRef.current &&
            roomId !== activeRoomIdRef.current
          ) {
            incrementUnread(roomId);
          }
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
  }

  function incrementUnread(roomId: string) {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: r.unread + 1 } : r)),
    );
    setApplicants((prev) =>
      prev.map((a) => (a.id === roomId ? { ...a, unread: a.unread + 1 } : a)),
    );
  }

  const markRoomAsRead = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r)),
    );
    setApplicants((prev) =>
      prev.map((a) => (a.id === roomId ? { ...a, unread: 0 } : a)),
    );
  }, []);

  function deleteRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  function deleteApplicant(id: string) {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
  }

  return {
    rooms,
    applicants,
    posts,
    loading,
    error,
    deleteRoom,
    deleteApplicant,
    markRoomAsRead,
    updatePreview: updateRoomPreview,
  };
}
