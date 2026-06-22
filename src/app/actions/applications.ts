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

export async function createApplication(
  requestId: string,
  input: { message?: string | null; proposed_price?: number | null },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  if (input.proposed_price != null && input.proposed_price < 0) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "제안 금액은 0 이상이어야 합니다.",
      },
    };
  }

  const db = createServiceClient();

  const { data: sitter } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitter) {
    return {
      error: { code: "FORBIDDEN", message: "펫시터만 지원할 수 있습니다." },
    };
  }

  const { data: requestRow } = await db
    .from("requests")
    .select("id, status, owner_id")
    .eq("id", requestId)
    .single();

  if (!requestRow) {
    return {
      error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." },
    };
  }

  if (requestRow.status !== "open") {
    return {
      error: {
        code: "FORBIDDEN",
        message: "모집 중인 구인글에만 지원할 수 있습니다.",
      },
    };
  }

  const { data: existing } = await db
    .from("applications")
    .select("id")
    .eq("request_id", requestId)
    .eq("sitter_id", sitter.id)
    .maybeSingle();

  if (existing) {
    return {
      error: { code: "CONFLICT", message: "이미 지원한 구인글입니다." },
    };
  }

  const { data, error } = await db
    .from("applications")
    .insert({
      request_id: requestId,
      sitter_id: sitter.id,
      message: input.message ?? null,
      proposed_price: input.proposed_price ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  const { data: existingRoom } = await db
    .from("chat_rooms")
    .select("id")
    .eq("request_id", requestId)
    .eq("sitter_id", sitter.id)
    .maybeSingle();

  if (!existingRoom) {
    const { error: roomError } = await db.from("chat_rooms").insert({
      room_type: "request",
      owner_id: requestRow.owner_id,
      sitter_id: sitter.id,
      request_id: requestId,
    });

    if (roomError) {
      return {
        error: { code: "INTERNAL_ERROR", message: roomError.message },
      };
    }
  }

  return { data };
}

export async function updateApplication(
  id: string,
  input: { status: "selected" | "rejected" | "canceled" },
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: application } = await db
    .from("applications")
    .select(
      `id, sitter_id, request_id, proposed_price, status,
       requests!inner(id, owner_id, start_datetime, end_datetime, budget, status)`,
    )
    .eq("id", id)
    .single();

  if (!application) {
    return {
      error: { code: "NOT_FOUND", message: "지원 정보를 찾을 수 없습니다." },
    };
  }

  const requestRow = application.requests as unknown as {
    id: string;
    owner_id: string;
    start_datetime: string;
    end_datetime: string;
    budget: number;
    status: string;
  };

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwner = requestRow.owner_id === user.id;
  const isSitter = sitterProfile?.id === application.sitter_id;

  if (input.status === "selected" || input.status === "rejected") {
    if (!isOwner) {
      return {
        error: {
          code: "FORBIDDEN",
          message: "구인글 작성자만 선택/거절할 수 있습니다.",
        },
      };
    }
  } else if (input.status === "canceled") {
    if (!isSitter) {
      return {
        error: {
          code: "FORBIDDEN",
          message: "지원한 펫시터만 취소할 수 있습니다.",
        },
      };
    }
  }

  if (input.status === "selected") {
    if (requestRow.status !== "open") {
      return {
        error: { code: "FORBIDDEN", message: "이미 매칭된 구인글입니다." },
      };
    }

    const totalPrice = application.proposed_price ?? requestRow.budget;

    const { data: reservation, error: reservationError } = await db
      .from("reservations")
      .insert({
        owner_id: requestRow.owner_id,
        sitter_id: application.sitter_id,
        service_id: null,
        request_id: requestRow.id,
        application_id: id,
        start_datetime: requestRow.start_datetime,
        end_datetime: requestRow.end_datetime,
        total_price: totalPrice,
        status: "pending",
      })
      .select()
      .single();

    if (reservationError) {
      return {
        error: { code: "INTERNAL_ERROR", message: reservationError.message },
      };
    }

    const { data: requestPets } = await db
      .from("request_pets")
      .select("pet_id")
      .eq("request_id", requestRow.id);

    if (requestPets && requestPets.length > 0) {
      await db.from("reservation_items").insert(
        requestPets.map(({ pet_id }) => ({
          reservation_id: reservation.id,
          pet_id,
        })),
      );
    }

    const { data: existingRoom } = await db
      .from("chat_rooms")
      .select("id")
      .eq("request_id", requestRow.id)
      .eq("sitter_id", application.sitter_id)
      .maybeSingle();

    if (!existingRoom) {
      await db.from("chat_rooms").insert({
        room_type: "request",
        owner_id: requestRow.owner_id,
        sitter_id: application.sitter_id,
        request_id: requestRow.id,
        reservation_id: reservation.id,
      });
    }

    await db
      .from("requests")
      .update({ status: "matched" })
      .eq("id", requestRow.id);
  }

  const { data, error } = await db
    .from("applications")
    .update({ status: input.status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  return { data };
}

export async function updateApplicationByRoom(
  roomId: string,
  status: "selected" | "rejected",
) {
  const user = await getAuthUser();
  if (!user) {
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } };
  }

  const db = createServiceClient();

  const { data: room } = await db
    .from("chat_rooms")
    .select("request_id, sitter_id")
    .eq("id", roomId)
    .single();

  if (!room?.request_id) {
    return {
      error: { code: "NOT_FOUND", message: "채팅방을 찾을 수 없습니다." },
    };
  }

  const { data: application } = await db
    .from("applications")
    .select("id")
    .eq("request_id", room.request_id)
    .eq("sitter_id", room.sitter_id)
    .maybeSingle();

  if (!application) {
    return {
      error: { code: "NOT_FOUND", message: "지원 정보를 찾을 수 없습니다." },
    };
  }

  return updateApplication(application.id, { status });
}
