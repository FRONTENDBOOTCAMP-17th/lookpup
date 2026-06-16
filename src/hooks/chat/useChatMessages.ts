/**
 * 메시지 목록 관리.
 *
 * 1. REST API
 *    reverse()로 오래된 메시지부터 표시.
 *
 * 2. Realtime - postgres changes
 *    신규 메세지가 DB에 저장되면 supabase가 현 메시지 끝에 보여줌.
 *    채팅방이 바뀌거나 컴포넌트가 사라지면 해당 구독을 해제함.
 */
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
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

  // 기존 메세지 로드
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
          setMessages((prev) => [
            ...prev,
            {
              id: m.id,
              from: m.sender_id === userId ? "me" : "other",
              text: m.content,
              time: formatTime(m.created_at),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  return { messages, addMessage };
}
