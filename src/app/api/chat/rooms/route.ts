import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }

  const db = createServiceClient();

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const sitterId = sitterProfile?.id ?? null;

  let roomsQuery = db
    .from("chat_rooms")
    .select(
      `id, room_type, owner_id, sitter_id, reservation_id,
       owner:users!owner_id(full_name, profile_image),
       sitter:sitters!sitter_id(
         user_id,
         sitter_user:users(full_name, profile_image)
       )`,
    )
    .order("created_at", { ascending: false });

  if (sitterId) {
    roomsQuery = roomsQuery.or(`owner_id.eq.${user.id},sitter_id.eq.${sitterId}`);
  } else {
    roomsQuery = roomsQuery.eq("owner_id", user.id);
  }

  const { data: rooms, error } = await roomsQuery;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // 읽지 않은 메시지 수 일괄 조회
  const roomIds = rooms.map((r) => r.id);
  const { data: unreadMessages } = await db
    .from("messages")
    .select("room_id")
    .in("room_id", roomIds)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  const unreadCounts: Record<string, number> = {};
  (unreadMessages ?? []).forEach((msg) => {
    unreadCounts[msg.room_id] = (unreadCounts[msg.room_id] ?? 0) + 1;
  });

  const result = rooms.map((room) => {
    const isOwner = room.owner_id === user.id;
    const owner = room.owner as unknown as { full_name: string; profile_image: string | null };
    const sitter = room.sitter as unknown as {
      sitter_user: { full_name: string; profile_image: string | null };
    };

    return {
      id: room.id,
      room_type: room.room_type,
      owner_id: room.owner_id,
      sitter_id: room.sitter_id,
      other_user_full_name: isOwner
        ? (sitter?.sitter_user?.full_name ?? "")
        : (owner?.full_name ?? ""),
      other_user_profile_image: isOwner
        ? (sitter?.sitter_user?.profile_image ?? null)
        : (owner?.profile_image ?? null),
      unread_count: unreadCounts[room.id] ?? 0,
      reservation_id: room.reservation_id,
    };
  });

  return NextResponse.json({ data: result });
}
