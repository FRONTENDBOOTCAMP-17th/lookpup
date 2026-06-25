"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { createNotification } from "@/lib/notificationHelpers";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function findOrCreateRoom(input: {
  sitter_id: string;
  room_type: "request" | "direct";
  request_id?: string | null;
}) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  let existingRoom: { id: string } | null = null;

  if (input.room_type === "request" && input.request_id) {
    const { data } = await db
      .from("chat_rooms")
      .select("id")
      .eq("request_id", input.request_id)
      .eq("sitter_id", input.sitter_id)
      .maybeSingle();
    existingRoom = data;
  } else {
    const { data } = await db
      .from("chat_rooms")
      .select("id")
      .eq("owner_id", user.id)
      .eq("sitter_id", input.sitter_id)
      .eq("room_type", "direct")
      .maybeSingle();
    existingRoom = data;
  }

  if (existingRoom) {
    return { data: { room_id: existingRoom.id } };
  }

  const { data: newRoom, error } = await db
    .from("chat_rooms")
    .insert({
      room_type: input.room_type,
      owner_id: user.id,
      sitter_id: input.sitter_id,
      request_id: input.request_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { room_id: newRoom.id } };
}

export async function sendMessage(roomId: string, content: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!content || content.trim().length === 0) {
    return { error: { code: "VALIDATION_ERROR", message: "메시지 내용을 입력해주세요." } };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return { error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." } };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "채팅방 참여자만 메시지를 보낼 수 있습니다." } };
  }

  const now = new Date().toISOString();

  const { data: message, error: msgError } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content: content.trim() })
    .select()
    .single();

  if (msgError) {
    return { error: { code: "INTERNAL_ERROR", message: msgError.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: content.trim(), last_message_at: now })
    .eq("id", roomId);

  const recipientId =
    user.id === room.owner_id ? room.sitters.user_id : room.owner_id;
  const chatLink = `/chat?roomId=${roomId}`;

  const { data: sender } = await db
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName = sender?.full_name ?? "상대방";
  const notificationContent = `${senderName}: ${content.trim().slice(0, 50)}`;

  const { data: existingNotifications } = await db
    .from("notifications")
    .select("id")
    .eq("user_id", recipientId)
    .eq("type", "message")
    .eq("link_url", chatLink)
    .eq("is_read", false)
    .limit(1);

  const existingNotification = existingNotifications?.[0] ?? null;

  if (existingNotification) {
    await db
      .from("notifications")
      .update({ content: notificationContent })
      .eq("id", existingNotification.id);
  } else {
    await createNotification({
      userId: recipientId,
      type: "message",
      title: "새로운 메시지가 왔어요",
      content: notificationContent,
      linkUrl: chatLink,
    });
  }

  return { data: message };
}

const SYSTEM_MSG_PREFIX = "__system__:";
const IMAGE_MSG_PREFIX = "__image__:";
const PAYMENT_REQUEST_PREFIX = "__payment_request__:";
const PAYMENT_COMPLETE_PREFIX = "__payment_complete__:";
const APPLICATION_SELECTED_PREFIX = "__application_selected__:";
const APPLICATION_REJECTED_PREFIX = "__application_rejected__";
const RESERVATION_CANCELED_PREFIX = "__reservation_canceled__";

export async function sendImageMessage(roomId: string, imageUrl: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return { error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." } };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "채팅방 참여자만 메시지를 보낼 수 있습니다." } };
  }

  const now = new Date().toISOString();

  const { data: message, error: msgError } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content: `${IMAGE_MSG_PREFIX}${imageUrl}` })
    .select()
    .single();

  if (msgError) {
    return { error: { code: "INTERNAL_ERROR", message: msgError.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "사진", last_message_at: now })
    .eq("id", roomId);

  const recipientId =
    user.id === room.owner_id ? room.sitters.user_id : room.owner_id;
  const chatLink = `/chat?roomId=${roomId}`;

  const { data: sender } = await db
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName = sender?.full_name ?? "상대방";
  const notificationContent = `${senderName}: 사진을 보냈습니다.`;

  const { data: existingNotifications } = await db
    .from("notifications")
    .select("id")
    .eq("user_id", recipientId)
    .eq("type", "message")
    .eq("link_url", chatLink)
    .eq("is_read", false)
    .limit(1);

  const existingNotification = existingNotifications?.[0] ?? null;

  if (existingNotification) {
    await db
      .from("notifications")
      .update({ content: notificationContent })
      .eq("id", existingNotification.id);
  } else {
    await createNotification({
      userId: recipientId,
      type: "message",
      title: "새로운 메시지가 왔어요",
      content: notificationContent,
      linkUrl: chatLink,
    });
  }

  return { data: message };
}

export async function sendSystemMessage(roomId: string, content: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: message, error } = await db
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: `${SYSTEM_MSG_PREFIX}${content}`,
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: content, last_message_at: now })
    .eq("id", roomId);

  return { data: message };
}

export async function sendPaymentRequestMessage(
  roomId: string,
  data: { amount: number; reason: string; deadline: string; costItems?: { id: string; name: string; amount: string; description: string }[] },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();
  const content = `${PAYMENT_REQUEST_PREFIX}${JSON.stringify(data)}`;

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "결제 요청", last_message_at: now })
    .eq("id", roomId);

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (room) {
    const recipientId =
      user.id === room.owner_id ? room.sitters.user_id : room.owner_id;
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: "message",
        title: "결제 요청이 도착했어요",
        content: `${data.amount.toLocaleString("ko-KR")}원 결제 요청이 왔어요.`,
        linkUrl: `/chat?roomId=${roomId}`,
      });
    }
  }

  return { data: message };
}

export async function sendPaymentCompleteMessage(
  roomId: string,
  data: { amount: number },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();
  const content = `${PAYMENT_COMPLETE_PREFIX}${JSON.stringify(data)}`;

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "결제 완료", last_message_at: now })
    .eq("id", roomId);

  return { data: message };
}

export async function sendAutoPaymentRequestMessage(
  roomId: string,
  data: { amount: number; reason: string; deadline: string; postId?: string; costItems?: { id: string; name: string; amount: string; description: string }[] },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return { error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." } };
  }

  if (room.owner_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "보호자만 이 작업을 할 수 있습니다." } };
  }

  const sitterUserId = room.sitters.user_id;
  const now = new Date().toISOString();
  const content = `${PAYMENT_REQUEST_PREFIX}${JSON.stringify(data)}`;

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: sitterUserId, content })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "결제 요청", last_message_at: now })
    .eq("id", roomId);

  await createNotification({
    userId: user.id,
    type: "message",
    title: "결제 요청이 도착했어요",
    content: `${data.amount.toLocaleString("ko-KR")}원 결제 요청이 왔어요.`,
    linkUrl: `/chat?roomId=${roomId}`,
  });

  return { data: message };
}

export async function sendApplicationSelectedMessage(
  roomId: string,
  data: { postTitle: string; postId: string; sitterId: string },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();
  const content = `${APPLICATION_SELECTED_PREFIX}${JSON.stringify(data)}`;

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "선택 확정", last_message_at: now })
    .eq("id", roomId);

  return { data: message };
}

export async function sendApplicationRejectedMessage(roomId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content: APPLICATION_REJECTED_PREFIX })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "지원 거절", last_message_at: now })
    .eq("id", roomId);

  return { data: message };
}

export async function sendReservationCanceledMessage(roomId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: message, error } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content: RESERVATION_CANCELED_PREFIX })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "예약 취소", last_message_at: now })
    .eq("id", roomId);

  return { data: message };
}

export async function markRoomRead(roomId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return { error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." } };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return { error: { code: "FORBIDDEN", message: "채팅방 참여자만 읽음 처리할 수 있습니다." } };
  }

  const { error } = await db
    .from("messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { ok: true } };
}
