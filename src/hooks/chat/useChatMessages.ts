/**
 * 메시지 목록 관리.
 *
 * 1. REST API
 *    reverse()로 오래된 메시지부터 표시.
 *
 * 2. Realtime - broadcast
 *    메시지 전송 시 채널로 broadcast하고, 상대방은 broadcast 구독으로 수신.
 *    채팅방이 바뀌거나 컴포넌트가 사라지면 해당 구독을 해제함.
 */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message } from "@/components/common/chat/chat_components";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageApiItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useChatMessages(
  activeRoomId: string | null,
  userId: string | null,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 기존 메시지 로드
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    fetch(`/api/chat/rooms/${activeRoomId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("메시지를 불러오지 못했습니다");
        return res.json();
      })
      .then(({ data }: { data: { messages: MessageApiItem[] } }) => {
        const mapped: Message[] = data.messages.reverse().map((m) => ({
          id: m.id,
          from: m.sender_id === userId ? "me" : "other",
          text: m.content,
          time: formatTime(m.created_at),
        }));
        setMessages(mapped);
      })
      .catch((err: Error) => console.error(err.message));
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
        setMessages((prev) => [
          ...prev,
          {
            id: m.id,
            from: "other",
            text: m.content,
            time: formatTime(m.created_at),
          },
        ]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRoomId, userId]);

  function addMessage(m: MessageApiItem) {
    setMessages((prev) => [
      ...prev,
      {
        id: m.id,
        from: m.sender_id === userId ? "me" : "other",
        text: m.content,
        time: formatTime(m.created_at),
      },
    ]);
  }

  function broadcastMessage(m: MessageApiItem) {
    channelRef.current?.send({
      type: "broadcast",
      event: "new_message",
      payload: m,
    });
  }

  return { messages, addMessage, broadcastMessage };
}
