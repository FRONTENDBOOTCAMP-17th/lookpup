/**
 * 메시지 목록 관리.
 *
 * 1. REST API (cursor 기반 페이지네이션)
 *    최신 50건 로드, 스크롤 최상단 도달 시 loadMore()로 이전 메시지 prepend.
 *
 * 2. Realtime - postgres_changes
 *    신규 메시지가 DB에 저장되면 목록 끝에 추가.
 *    채팅방이 바뀌거나 컴포넌트가 사라지면 구독 해제.
 */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Message } from "@/components/common/chat/chat_components";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface MessageApiItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function toMessage(m: MessageApiItem, userId: string): Message {
  return {
    id: m.id,
    from: m.sender_id === userId ? "me" : "other",
    text: m.content,
    time: formatTime(m.created_at),
  };
}

export function useChatMessages(
  activeRoomId: string | null,
  userId: string | null,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // 내가 보낸 메시지 ID를 추적해 postgres_changes 중복 방지
  const sentMessageIds = useRef<Set<string>>(new Set());

  // 방이 바뀌면 상태 초기화 후 최신 메시지 로드
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    sentMessageIds.current = new Set();

    fetch(`/api/chat/rooms/${activeRoomId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("메시지를 불러오지 못했습니다");
        return res.json();
      })
      .then(
        ({
          data,
        }: {
          data: { messages: MessageApiItem[]; next_cursor: string | null };
        }) => {
          setMessages(data.messages.reverse().map((m) => toMessage(m, userId)));
          setNextCursor(data.next_cursor);
          setHasMore(data.next_cursor !== null);
        },
      )
      .catch((err: Error) => console.error(err.message));
  }, [activeRoomId, userId]);

  // Realtime
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room-${activeRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          const m = payload.new as MessageApiItem;
          // addMessage()로 이미 추가한 자신의 메시지는 건너뜀
          if (sentMessageIds.current.has(m.id)) return;
          setMessages((prev) => [...prev, toMessage(m, userId)]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, userId]);

  function addMessage(m: MessageApiItem) {
    sentMessageIds.current.add(m.id);
    setMessages((prev) => [...prev, toMessage(m, userId ?? "")]);
  }

  async function loadMore() {
    if (!nextCursor || !activeRoomId || !userId || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/chat/rooms/${activeRoomId}/messages?cursor=${nextCursor}`,
      );
      if (!res.ok) return;
      const {
        data,
      }: {
        data: { messages: MessageApiItem[]; next_cursor: string | null };
      } = await res.json();

      const older = data.messages.reverse().map((m) => toMessage(m, userId));
      setMessages((prev) => [...older, ...prev]);
      setNextCursor(data.next_cursor);
      setHasMore(data.next_cursor !== null);
    } finally {
      setLoadingMore(false);
    }
  }

  return { messages, addMessage, loadMore, hasMore, loadingMore };
}
