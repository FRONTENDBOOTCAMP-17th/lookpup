"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { createNotification } from "@/lib/notificationHelpers";
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
  RESERVATION_EDIT_PREFIX,
  RESERVATION_EDIT_RESPONSE_PREFIX,
} from "@/lib/chatMessagePrefixes";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function findOrCreateRoom(input: {
  sitter_id: string;
  room_type: "request" | "direct" | "reservation_request";
  request_id?: string | null;
  reservation_id?: string | null;
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
  } else if (input.reservation_id) {
    const { data } = await db
      .from("chat_rooms")
      .select("id")
      .eq("reservation_id", input.reservation_id)
      .eq("room_type", "direct")
      .maybeSingle();
    existingRoom = data;
  } else {
    const [{ data: otherSitter }, { data: mySitter }] = await Promise.all([
      db
        .from("sitters")
        .select("user_id")
        .eq("id", input.sitter_id)
        .maybeSingle(),
      db.from("sitters").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

    const otherUserId = otherSitter?.user_id;
    const mySitterId = mySitter?.id;

    if (otherUserId && mySitterId) {
      const { data } = await db
        .from("chat_rooms")
        .select("id")
        .eq("room_type", "direct")
        .or(
          `and(owner_id.eq.${user.id},sitter_id.eq.${input.sitter_id}),` +
            `and(owner_id.eq.${otherUserId},sitter_id.eq.${mySitterId})`,
        )
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
  }

  if (existingRoom) {
    if (input.reservation_id) {
      await db
        .from("chat_rooms")
        .update({ reservation_id: input.reservation_id })
        .eq("id", existingRoom.id);
    }
    return { data: { room_id: existingRoom.id } };
  }

  const { data: newRoom, error } = await db
    .from("chat_rooms")
    .insert({
      room_type: input.room_type,
      owner_id: user.id,
      sitter_id: input.sitter_id,
      request_id: input.request_id ?? null,
      reservation_id: input.reservation_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data: { room_id: newRoom.id } };
}

export async function findChatRoomAsSitter(ownerId: string, reservationId?: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  if (reservationId) {
    const { data: room } = await db
      .from("chat_rooms")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("room_type", "direct")
      .maybeSingle();
    if (room) return { data: { room_id: room.id } };
  }

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile) {
    return {
      error: { code: "NOT_FOUND", message: "시터 정보를 찾을 수 없습니다." },
    };
  }

  const { data: room } = await db
    .from("chat_rooms")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("sitter_id", sitterProfile.id)
    .eq("room_type", "direct")
    .maybeSingle();

  return { data: room ? { room_id: room.id } : null };
}

export async function sendMessage(roomId: string, content: string) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (!content || content.trim().length === 0) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "메시지 내용을 입력해주세요.",
      },
    };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitters!inner(user_id)")
    .eq("id", roomId)
    .single();

  if (!room) {
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "채팅방 참여자만 메시지를 보낼 수 있습니다.",
      },
    };
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
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "채팅방 참여자만 메시지를 보낼 수 있습니다.",
      },
    };
  }

  const now = new Date().toISOString();

  const { data: message, error: msgError } = await db
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: `${IMAGE_MSG_PREFIX}${imageUrl}`,
    })
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
  data: {
    amount: number;
    reason: string;
    deadline: string;
    isExtra?: boolean;
    costItems?: {
      id: string;
      name: string;
      amount: string;
      description: string;
    }[];
  },
  reservationId?: string,
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
    .select("id, owner_id, sitters!inner(id, user_id)")
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

    if (data.isExtra && reservationId) {
      await db.from("extra_charges").insert({
        reservation_id: reservationId,
        sitter_id: room.sitters.id,
        owner_id: room.owner_id,
        amount: data.amount,
        reason: data.reason,
        status: "pending",
      });
    }
  }

  return { data: message };
}

export async function sendPaymentCompleteMessage(
  roomId: string,
  data: { amount: number; paymentRequestMessageId?: string },
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
  data: {
    amount: number;
    reason: string;
    deadline: string;
    postId?: string;
    costItems?: {
      id: string;
      name: string;
      amount: string;
      description: string;
    }[];
  },
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
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.owner_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "보호자만 이 작업을 할 수 있습니다.",
      },
    };
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
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: APPLICATION_REJECTED_PREFIX,
    })
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
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: RESERVATION_CANCELED_PREFIX,
    })
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

export async function sendServiceCompleteMessage(
  roomId: string,
  reservationId: string,
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
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.sitters.user_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "펫시터만 서비스 완료를 요청할 수 있습니다.",
      },
    };
  }

  const { data: reservation } = await db
    .from("reservations")
    .select(
      "start_datetime, end_datetime, total_price, services(title, service_type), reservation_items(pets(name))",
    )
    .eq("id", reservationId)
    .single();

  const SERVICE_TYPE_LABEL: Record<string, string> = {
    walk: "산책",
    care: "방문 돌봄",
    hotel: "위탁 돌봄",
    pickup: "픽업",
  };
  type ServiceRow = { title: string; service_type: string };
  type PetRow = { name: string } | null;
  type ItemRow = { pets: PetRow };
  const rawServices = reservation?.services;
  const service = (
    Array.isArray(rawServices) ? rawServices[0] : rawServices
  ) as ServiceRow | null;
  const items = (reservation?.reservation_items as ItemRow[]) ?? [];
  const serviceTitle =
    service?.title ||
    (service?.service_type
      ? (SERVICE_TYPE_LABEL[service.service_type] ?? service.service_type)
      : null) ||
    "반려동물 이름";
  const petName = items[0]?.pets?.name ?? undefined;
  const startDatetime = reservation?.start_datetime ?? undefined;
  const endDatetime = reservation?.end_datetime ?? undefined;
  const totalPrice = reservation?.total_price ?? undefined;

  const now = new Date().toISOString();
  const content = `${SERVICE_COMPLETE_PREFIX}${JSON.stringify({ reservationId, serviceTitle, petName, startDatetime, endDatetime, totalPrice })}`;

  const { data: message, error } = await db
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  await db
    .from("chat_rooms")
    .update({ last_message: "서비스 완료", last_message_at: now })
    .eq("id", roomId);

  if (room.owner_id) {
    await createNotification({
      userId: room.owner_id,
      type: "message",
      title: "서비스가 완료되었어요",
      content: "펫시터가 서비스를 완료했습니다. 확인해주세요.",
      linkUrl: `/chat?roomId=${roomId}`,
    });
  }

  return { data: message };
}

export async function sendServiceStartMessage(
  roomId: string,
  reservationId: string,
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
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.sitters.user_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "펫시터만 서비스 시작을 알릴 수 있습니다.",
      },
    };
  }

  const { data: reservation } = await db
    .from("reservations")
    .select(
      "start_datetime, end_datetime, total_price, services(title, service_type), reservation_items(pets(name))",
    )
    .eq("id", reservationId)
    .single();

  const SERVICE_TYPE_LABEL: Record<string, string> = {
    walk: "산책",
    care: "방문 돌봄",
    hotel: "위탁 돌봄",
    pickup: "픽업",
  };
  type ServiceRow = { title: string; service_type: string };
  type PetRow = { name: string } | null;
  type ItemRow = { pets: PetRow };
  const rawServices = reservation?.services;
  const service = (
    Array.isArray(rawServices) ? rawServices[0] : rawServices
  ) as ServiceRow | null;
  const items = (reservation?.reservation_items as ItemRow[]) ?? [];
  const serviceTitle =
    service?.title ||
    (service?.service_type
      ? (SERVICE_TYPE_LABEL[service.service_type] ?? service.service_type)
      : null) ||
    "펫시팅 서비스";
  const petName = items[0]?.pets?.name ?? undefined;
  const startDatetime = reservation?.start_datetime ?? undefined;
  const endDatetime = reservation?.end_datetime ?? undefined;
  const totalPrice = reservation?.total_price ?? undefined;

  const now = new Date().toISOString();
  const content = `${SERVICE_START_PREFIX}${JSON.stringify({ reservationId, serviceTitle, petName, startDatetime, endDatetime, totalPrice })}`;

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
    .update({ last_message: "서비스 시작", last_message_at: now })
    .eq("id", roomId);

  if (room.owner_id) {
    await createNotification({
      userId: room.owner_id,
      type: "message",
      title: "서비스가 시작되었어요",
      content: "펫시터가 서비스를 시작했습니다.",
      linkUrl: `/chat?roomId=${roomId}`,
    });
  }

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
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  if (room.owner_id !== user.id && room.sitters.user_id !== user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "채팅방 참여자만 읽음 처리할 수 있습니다.",
      },
    };
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

export async function sendReservationEditMessage(
  roomId: string,
  payload: {
    reservationId: string;
    original: { start_datetime: string; end_datetime: string; memo?: string | null };
    proposed: { start_datetime: string; end_datetime: string; memo?: string | null };
  },
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

  const sitter = room.sitters as unknown as { user_id: string };
  if (room.owner_id !== user.id && sitter.user_id !== user.id) {
    return {
      error: { code: "FORBIDDEN", message: "채팅방 참여자만 메시지를 보낼 수 있습니다." },
    };
  }

  const content = `${RESERVATION_EDIT_PREFIX}${JSON.stringify(payload)}`;

  const { data: message, error: msgError } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content })
    .select()
    .single();

  if (msgError) {
    return { error: { code: "INTERNAL_ERROR", message: msgError.message } };
  }

  await db
    .from("chat_rooms")
    .update({
      last_message: "예약 수정 요청",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  const sitterForNotif = room.sitters as unknown as { user_id: string };
  const recipientId = user.id === room.owner_id ? sitterForNotif.user_id : room.owner_id;
  if (recipientId) {
    await createNotification({
      userId: recipientId,
      type: "message",
      title: "예약 수정 요청이 도착했어요",
      content: "예약 일정 수정을 요청했습니다. 확인해주세요.",
      linkUrl: `/chat?roomId=${roomId}`,
    });
  }

  return { data: message };
}

export async function sendReservationEditResponseMessage(
  roomId: string,
  payload: { originalMessageId: string; accepted: boolean },
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

  const sitter = room.sitters as unknown as { user_id: string };
  if (room.owner_id !== user.id && sitter.user_id !== user.id) {
    return {
      error: { code: "FORBIDDEN", message: "채팅방 참여자만 메시지를 보낼 수 있습니다." },
    };
  }

  const content = `${RESERVATION_EDIT_RESPONSE_PREFIX}${JSON.stringify(payload)}`;

  const { data: message, error: msgError } = await db
    .from("messages")
    .insert({ room_id: roomId, sender_id: user.id, content })
    .select()
    .single();

  if (msgError) {
    return { error: { code: "INTERNAL_ERROR", message: msgError.message } };
  }

  const lastMsg = payload.accepted ? "예약 수정 승인" : "예약 수정 거절";
  await db
    .from("chat_rooms")
    .update({ last_message: lastMsg, last_message_at: new Date().toISOString() })
    .eq("id", roomId);

  const recipientId = user.id === room.owner_id ? sitter.user_id : room.owner_id;
  if (recipientId) {
    await createNotification({
      userId: recipientId,
      type: "message",
      title: payload.accepted ? "예약 수정이 승인되었어요" : "예약 수정 요청이 거절되었어요",
      content: payload.accepted
        ? "예약 수정 요청이 승인되었습니다."
        : "예약 수정 요청이 거절되었습니다.",
      linkUrl: `/chat?roomId=${roomId}`,
    });
  }

  return { data: message };
}
