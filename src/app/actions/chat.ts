"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

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

  const sitter = room.sitters as unknown as { user_id: string };
  if (room.owner_id !== user.id && sitter.user_id !== user.id) {
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

  const sitter = room.sitters as unknown as { user_id: string };
  if (room.owner_id !== user.id && sitter.user_id !== user.id) {
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
