import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roomId } = await params;

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

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, owner_id, sitter_id")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const isOwner = room.owner_id === user.id;
  let isSitter = false;
  if (!isOwner && room.sitter_id) {
    const { data: sitter } = await db
      .from("sitters")
      .select("id")
      .eq("id", room.sitter_id)
      .eq("user_id", user.id)
      .maybeSingle();
    isSitter = !!sitter;
  }

  if (!isOwner && !isSitter) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "채팅방 참여자만 나갈 수 있습니다.",
        },
      },
      { status: 403 },
    );
  }

  const updateData = isOwner ? { owner_left: true } : { sitter_left: true };

  const { data: updated, error: updateError } = await db
    .from("chat_rooms")
    .update(updateData)
    .eq("id", roomId)
    .select("owner_left, sitter_left")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: updateError.message } },
      { status: 500 },
    );
  }

  if (updated.owner_left && updated.sitter_left) {
    await db.from("chat_rooms").delete().eq("id", roomId);
  }

  return NextResponse.json({ data: { id: roomId } });
}
