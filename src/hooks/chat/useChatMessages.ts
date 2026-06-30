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
import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Message,
  PaymentData,
  ApplicationData,
  ServiceCompleteData,
  ReservationRequestData,
  ReservationAcceptedData,
  ReservationEditPayload,
  ReservationEditResponsePayload,
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
  created_at: string | null;
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
      time: m.created_at ? formatTime(m.created_at) : "",
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(PAYMENT_REQUEST_PREFIX)) {
    try {
      const data = JSON.parse(
        m.content.slice(PAYMENT_REQUEST_PREFIX.length),
      ) as PaymentData;
      return {
        id: m.id,
        from: "payment_request" as const,
        text: "",
        paymentData: { ...data, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "결제 요청" };
    }
  }
  if (m.content.startsWith(PAYMENT_COMPLETE_PREFIX)) {
    try {
      const data = JSON.parse(
        m.content.slice(PAYMENT_COMPLETE_PREFIX.length),
      ) as { amount: number };
      return {
        id: m.id,
        from: "payment_complete" as const,
        text: "",
        paymentData: { amount: data.amount, reason: "", deadline: "" },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "결제 완료" };
    }
  }
  if (m.content.startsWith(APPLICATION_SELECTED_PREFIX)) {
    try {
      const data = JSON.parse(
        m.content.slice(APPLICATION_SELECTED_PREFIX.length),
      ) as ApplicationData;
      return {
        id: m.id,
        from: "application_selected" as const,
        text: "",
        applicationData: { ...data, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "선택 확정" };
    }
  }
  if (m.content.startsWith(APPLICATION_REJECTED_PREFIX)) {
    return {
      id: m.id,
      from: "application_rejected" as const,
      text: "",
      applicationData: {
        postTitle: "",
        postId: "",
        sitterId: "",
        sentByMe: m.sender_id === userId,
      },
      time: m.created_at ? formatTime(m.created_at) : undefined,
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(RESERVATION_CANCELED_PREFIX)) {
    return {
      id: m.id,
      from: "reservation_canceled" as const,
      text: "",
      sentByMe: m.sender_id === userId,
      time: m.created_at ? formatTime(m.created_at) : undefined,
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(SERVICE_COMPLETE_PREFIX)) {
    let serviceCompleteData: ServiceCompleteData | undefined;
    const jsonPart = m.content.slice(SERVICE_COMPLETE_PREFIX.length);
    if (jsonPart) {
      try {
        serviceCompleteData = JSON.parse(jsonPart) as ServiceCompleteData;
      } catch {}
    }
    return {
      id: m.id,
      from: "service_complete" as const,
      text: "",
      sentByMe: m.sender_id === userId,
      serviceCompleteData,
      time: m.created_at ? formatTime(m.created_at) : undefined,
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(SERVICE_START_PREFIX)) {
    let serviceStartData: ServiceCompleteData | undefined;
    const jsonPart = m.content.slice(SERVICE_START_PREFIX.length);
    if (jsonPart) {
      try {
        serviceStartData = JSON.parse(jsonPart) as ServiceCompleteData;
      } catch {}
    }
    return {
      id: m.id,
      from: "service_start" as const,
      text: "",
      sentByMe: m.sender_id === userId,
      serviceStartData,
      time: m.created_at ? formatTime(m.created_at) : undefined,
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(RESERVATION_REQUEST_PREFIX)) {
    try {
      const data = JSON.parse(
        m.content.slice(RESERVATION_REQUEST_PREFIX.length),
      ) as ReservationRequestData;
      return {
        id: m.id,
        from: "reservation_request" as const,
        text: "",
        reservationRequestData: { ...data, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "예약 요청" };
    }
  }
  if (m.content.startsWith(RESERVATION_ACCEPTED_PREFIX)) {
    try {
      const data = JSON.parse(
        m.content.slice(RESERVATION_ACCEPTED_PREFIX.length),
      ) as ReservationAcceptedData;
      return {
        id: m.id,
        from: "reservation_accepted" as const,
        text: "",
        reservationAcceptedData: { ...data, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "예약 확정" };
    }
  }
  if (m.content === RESERVATION_REJECTED_PREFIX) {
    return {
      id: m.id,
      from: "reservation_rejected" as const,
      text: "",
      sentByMe: m.sender_id === userId,
      time: m.created_at ? formatTime(m.created_at) : undefined,
      rawDate: m.created_at ?? undefined,
    };
  }
  if (m.content.startsWith(RESERVATION_EDIT_PREFIX)) {
    try {
      const payload = JSON.parse(
        m.content.slice(RESERVATION_EDIT_PREFIX.length),
      ) as Omit<ReservationEditPayload, "sentByMe">;
      return {
        id: m.id,
        from: "reservation_edit" as const,
        text: "",
        reservationEditData: { ...payload, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "예약 수정 요청" };
    }
  }
  if (m.content.startsWith(RESERVATION_EDIT_RESPONSE_PREFIX)) {
    try {
      const payload = JSON.parse(
        m.content.slice(RESERVATION_EDIT_RESPONSE_PREFIX.length),
      ) as Omit<ReservationEditResponsePayload, "sentByMe">;
      return {
        id: m.id,
        from: "reservation_edit_response" as const,
        text: "",
        reservationEditResponseData: { ...payload, sentByMe: m.sender_id === userId },
        time: m.created_at ? formatTime(m.created_at) : undefined,
        rawDate: m.created_at ?? undefined,
      };
    } catch {
      return { id: m.id, from: "divider", text: "예약 수정 응답" };
    }
  }
  return {
    id: m.id,
    from: m.sender_id === userId ? "me" : "other",
    text: m.content,
    time: m.created_at ? formatTime(m.created_at) : "",
    rawDate: m.created_at ?? undefined,
  };
}

export interface PaymentStateInfo {
  amount: number;
  reason: string;
  deadline: string;
  paid: boolean;
  sentByMe: boolean;
}

function derivePaymentState(messages: Message[]): PaymentStateInfo | null {
  const reqIdx = messages.findLastIndex((m) => m.from === "payment_request");
  if (reqIdx === -1) return null;
  const completeIdx = messages.findLastIndex(
    (m) => m.from === "payment_complete",
  );
  const paid = completeIdx > reqIdx;
  const data = messages[reqIdx].paymentData!;
  return {
    amount: data.amount,
    reason: data.reason,
    deadline: data.deadline,
    paid,
    sentByMe: data.sentByMe ?? false,
  };
}

export function useChatMessages(
  activeRoomId: string | null,
  userId: string | null,
  refreshKey?: number,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    setMessages([]);
    setNextCursor(null);
    setHasMore(false);

    const controller = new AbortController();

    fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
      signal: controller.signal,
    })
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
  }, [activeRoomId, userId, refreshKey]);

  // Realtime broadcast 구독
  useEffect(() => {
    if (!activeRoomId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room-${activeRoomId}`)
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        const m = payload as MessageApiItem;
        if (m.sender_id === userId) return;
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === m.id)) return prev;
          return [...prev, toMessage(m, userId)];
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRoomId, userId]);

  useEffect(() => {
    if (!activeRoomId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room-db-${activeRoomId}`)
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
          if (m.sender_id === userId) return;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === m.id)) return prev;
            return [...prev, toMessage(m, userId)];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  function broadcastConfirmation() {
    channelRef.current?.send({
      type: "broadcast",
      event: "application_confirmed",
      payload: {},
    });
  }

  function broadcastReservationAccepted(roomId: string) {
    channelRef.current?.send({
      type: "broadcast",
      event: "reservation_accepted",
      payload: { room_id: roomId },
    });
  }

  const paymentState = useMemo(() => derivePaymentState(messages), [messages]);

  const confirmedEditIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of messages) {
      if (
        m.from === "reservation_edit_response" &&
        m.reservationEditResponseData?.originalMessageId
      ) {
        ids.add(m.reservationEditResponseData.originalMessageId);
      }
    }
    return ids;
  }, [messages]);

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

  return {
    messages,
    addMessage,
    broadcastMessage,
    broadcastConfirmation,
    broadcastReservationAccepted,
    loadMore,
    hasMore,
    loadingMore,
    paymentState,
    confirmedEditIds,
  };
}
