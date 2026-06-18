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

  // subscription callback 안에서 항상 최신값을 읽기 위한 refs
  const activeRoomIdRef = useRef(activeRoomId);
  const userIdRef = useRef(userId);
  const myRoomIdsRef = useRef(new Set<string>());

  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // rooms/applicants가 바뀔 때마다 내 방 목록 ref를 최신화
  useEffect(() => {
    myRoomIdsRef.current = new Set([
      ...rooms.map((r) => r.id),
      ...applicants.map((a) => a.id),
    ]);
  }, [rooms, applicants]);

  // 현재 로그인한 유저 ID 가져오기
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // 채팅방 목록 최초 로드
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

  // 비활성 방의 새 메시지를 postgres_changes로 감지 → unread 카운트 증가
  // broadcast와 달리 DB INSERT 이벤트이므로 오프라인 중에도 DB에 쌓이며,
  // 내가 접속하면 subscription이 살아나 이후 메시지부터 감지함
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("unread-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const { room_id, sender_id } = payload.new as {
            room_id: string;
            sender_id: string;
          };
          if (sender_id === userIdRef.current) return; // 내가 보낸 메시지 무시
          if (!myRoomIdsRef.current.has(room_id)) return; // 내 방이 아니면 무시
          if (room_id === activeRoomIdRef.current) return; // 지금 보고 있는 방이면 무시
          incrementUnread(room_id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // userId가 생기면 구독 시작, refs로 최신값 참조하므로 재구독 불필요

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
  };
}
