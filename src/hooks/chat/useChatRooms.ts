/**
 * 채팅 목록 전체 관리.
 * direct와 request 두 타입을 room_type으로 분리하고 각각 저장함!
 * rooms : 1:1 채팅 / applicants : 지원 목록 채팅 + posts : 구인글 목록
 *
 * 방 삭제하는 것 나중에 추가해야 함...확인할 것.
 * 지금의 deleteRoom / deleteApplicant는 클라이언트 목록에서만 제거함.
 */
import { useState, useEffect } from "react";
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

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((res) => {
        if (!res.ok) throw new Error("채팅 목록을 불러오지 못했습니다");
        return res.json();
      })
      .then(({ data }: { data: RoomApiItem[] }) => {
        setRooms(
          data
            .filter((r) => r.room_type === "direct")
            .map((r) => ({
              id: r.id,
              name: r.other_user_full_name ?? "",
              initial: (r.other_user_full_name ?? "?")[0],
              sub: "1:1 채팅",
              lastMessage: r.last_message ?? "",
              time: formatTime(r.last_message_at),
              unread: r.unread_count ?? 0,
            })),
        );

        const requestRooms = data.filter((r) => r.room_type === "request");

        setApplicants(
          requestRooms.map((r) => ({
            id: r.id,
            postId: r.request_id ?? "",
            name: r.other_user_full_name ?? "",
            initial: (r.other_user_full_name ?? "?")[0],
            rating: 0,
            preview: r.last_message ?? "",
            unread: r.unread_count ?? 0,
          })),
        );

        // request_id 기준으로 중복 없이 구인글 목록 생성
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
  };
}
