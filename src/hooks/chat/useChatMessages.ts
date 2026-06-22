/**
 * 메시지 목록 관리.
 *
 * 1. REST API (cursor 기반 페이지네이션)
 *    최신 50건 로드, 스크롤 최상단 도달 시 loadMore()로 이전 메시지 prepend.
 *
 * 2. Realtime - broadcast
 *    메시지 전송 시 채널로 broadcast하고, 상대방은 broadcast 구독으로 수신.
 *    채팅방이 바뀌거나 컴포넌트가 사라지면 해당 구독을 해제함.
 */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message } from "@/components/common/chat/chat_components";

const SYSTEM_MSG_PREFIX = "__system__:";
const IMAGE_MSG_PREFIX = "__image__:";

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
  if (m.content.startsWith(SYSTEM_MSG_PREFIX)) {
    return {
      id: m.id,
      from: "divider",
      text: m.content.slice(SYSTEM_MSG_PREFIX.length),
    };
  }
  if (m.content.startsWith(IMAGE_MSG_PREFIX)) {
    return {
      id: m.id,
      from: m.sender_id === userId ? "me" : "other",
      text: "",
      imageUrl: m.content.slice(IMAGE_MSG_PREFIX.length),
      time: formatTime(m.created_at),
    };
  }
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 방이 바뀌면 상태 초기화 후 최신 메시지 로드
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    setMessages([]);
    setNextCursor(null);
    setHasMore(false);

    const controller = new AbortController();

    fetch(`/api/chat/rooms/${activeRoomId}/messages`, { signal: controller.signal })
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
      .catch((err: Error) => {
        if (err.name !== "AbortError") console.error(err.message);
      });

    return () => controller.abort();
  }, [activeRoomId, userId]);

  // Realtime broadcast 구독
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room-${activeRoomId}`)
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        const m = payload as MessageApiItem;
        if (m.sender_id === userId) return;
        setMessages((prev) => [...prev, toMessage(m, userId)]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRoomId, userId]);

  function addMessage(m: MessageApiItem) {
    setMessages((prev) => [...prev, toMessage(m, userId ?? "")]);
  }

  function broadcastMessage(m: MessageApiItem) {
    channelRef.current?.send({
      type: "broadcast",
      event: "new_message",
      payload: m,
    });
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

  return { messages, addMessage, broadcastMessage, loadMore, hasMore, loadingMore };
}
