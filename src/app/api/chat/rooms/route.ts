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
      `id, room_type, owner_id, sitter_id, reservation_id, request_id,
       last_message, last_message_at,
       owner:users!owner_id(full_name, profile_image),
       sitter:sitters!sitter_id(
         user_id,
         sitter_user:users(full_name, profile_image)
       ),
       request:requests!request_id(title, status)`,
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (sitterId) {
    roomsQuery = roomsQuery.or(
      `and(owner_id.eq.${user.id},owner_left.is.false),and(sitter_id.eq.${sitterId},sitter_left.is.false)`,
    );
  } else {
    roomsQuery = roomsQuery
      .eq("owner_id", user.id)
      .eq("owner_left", false);
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

  const requestRooms = rooms.filter((r) => r.room_type === "request");
  const applicationStatusMap = new Map<string, string>();
  if (requestRooms.length > 0) {
    const requestIds = requestRooms
      .map((r) => r.request_id)
      .filter(Boolean) as string[];
    const sitterIds = requestRooms
      .map((r) => r.sitter_id)
      .filter(Boolean) as string[];
    const { data: applications } = await db
      .from("applications")
      .select("request_id, sitter_id, status")
      .in("request_id", requestIds)
      .in("sitter_id", sitterIds);
    (applications ?? []).forEach((a) => {
      applicationStatusMap.set(`${a.request_id}-${a.sitter_id}`, a.status);
    });
  }

  const roomIds = rooms.map((r) => r.id);
  const { data: unreadData } = await db
    .rpc("get_unread_counts", { room_ids: roomIds, my_id: user.id });

  const unreadCounts: Record<string, number> = {};
  (unreadData ?? []).forEach(({ room_id, count }) => {
    unreadCounts[room_id] = Number(count);
  });

  const result = rooms.map((room) => {
    const isOwner = room.owner_id === user.id;
    const owner = room.owner;
    const sitter = room.sitter;
    const request = room.request;

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
      request_id: room.request_id ?? null,
      request_title: request?.title ?? null,
      request_status: request?.status ?? null,
      application_status:
        room.room_type === "request" && room.request_id && room.sitter_id
          ? (applicationStatusMap.get(`${room.request_id}-${room.sitter_id}`) ??
            null)
          : null,
      last_message: room.last_message ?? null,
      last_message_at: room.last_message_at ?? null,
    };
  });

  return NextResponse.json({ data: result });
}
