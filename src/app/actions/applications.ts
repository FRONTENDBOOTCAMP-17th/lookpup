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

  if (requestRow.owner_id === user.id) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "본인의 구인글에는 지원할 수 없습니다.",
      },
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
    await db.from("chat_rooms").insert({
      room_type: "request",
      owner_id: requestRow.owner_id,
      sitter_id: sitter.id,
      request_id: requestId,
    });
  }

  const { data: sitterUser } = await db
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const sitterName = sitterUser?.full_name ?? "펫시터";

  await createNotification({
    userId: requestRow.owner_id,
    type: "application",
    title: "새로운 지원자가 도착했어요",
    content: `${sitterName}님이 구인글에 지원했습니다.`,
    linkUrl: `/board/${requestId}`,
  });

  return { data };
}

export async function getRequestDetailsForReservation(roomId: string) {
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
    return { error: { code: "NOT_FOUND", message: "구인글 정보를 찾을 수 없습니다." } };
  }

  const { data: request } = await db
    .from("requests")
    .select("id, title, start_datetime, end_datetime, request_type, location, budget, pet_id")
    .eq("id", room.request_id)
    .single();

  if (!request) {
    return { error: { code: "NOT_FOUND", message: "구인글을 찾을 수 없습니다." } };
  }

  const { data: application } = await db
    .from("applications")
    .select("proposed_price")
    .eq("request_id", room.request_id)
    .eq("sitter_id", room.sitter_id)
    .maybeSingle();

  let petName: string | null = null;
  let petAnimalType: string | null = null;
  let petBreed: string | null = null;
  if (request.pet_id) {
    const { data: pet } = await db
      .from("pets")
      .select("name, animal_type, breed")
      .eq("id", request.pet_id)
      .maybeSingle();
    if (pet) {
      petName = pet.name;
      petAnimalType = pet.animal_type;
      petBreed = pet.breed;
    }
  }

  return {
    data: {
      title: request.title,
      startDatetime: request.start_datetime,
      endDatetime: request.end_datetime,
      requestType: request.request_type,
      location: request.location,
      totalPrice: application?.proposed_price ?? request.budget,
      petName,
      petAnimalType,
      petBreed,
    },
  };
}

export async function updateApplication(
  id: string,
  input: { status: "selected" | "rejected" | "canceled" },
  overrides?: {
    startDatetime?: string | null;
    endDatetime?: string | null;
    totalPrice?: number | null;
    location?: string | null;
  },
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
       requests!inner(id, owner_id, start_datetime, end_datetime, budget, status, pet_id)`,
    )
    .eq("id", id)
    .single();

  if (!application) {
    return {
      error: { code: "NOT_FOUND", message: "지원 정보를 찾을 수 없습니다." },
    };
  }

  const requestRow = application.requests;

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

  let reservationId: string | null = null;

  if (input.status === "selected") {
    if (requestRow.status !== "open") {
      return {
        error: { code: "FORBIDDEN", message: "이미 매칭된 구인글입니다." },
      };
    }

    const totalPrice = overrides?.totalPrice ?? application.proposed_price ?? requestRow.budget ?? 0;
    const startDatetime = overrides?.startDatetime ?? requestRow.start_datetime;
    const endDatetime = overrides?.endDatetime ?? requestRow.end_datetime;

    const { data: reservation, error: reservationError } = await db
      .from("reservations")
      .insert({
        owner_id: requestRow.owner_id,
        sitter_id: application.sitter_id,
        service_id: null,
        request_id: requestRow.id,
        application_id: id,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        total_price: totalPrice,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reservationError) {
      return {
        error: { code: "INTERNAL_ERROR", message: reservationError.message },
      };
    }

    reservationId = reservation.id;

    type RequestRow = { pet_id?: string | null };
    const pet_id = (requestRow as RequestRow).pet_id;
    if (pet_id) {
      await db.from("reservation_items").insert({
        reservation_id: reservation.id,
        pet_id,
      });
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
    } else {
      await db
        .from("chat_rooms")
        .update({ reservation_id: reservation.id })
        .eq("id", existingRoom.id);
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

  if (input.status === "selected" || input.status === "rejected") {
    const { data: applicantSitter } = await db
      .from("sitters")
      .select("user_id")
      .eq("id", application.sitter_id)
      .single();

    if (applicantSitter?.user_id) {
      const { data: chatRoom } = await db
        .from("chat_rooms")
        .select("id")
        .eq("request_id", application.request_id)
        .eq("sitter_id", application.sitter_id)
        .maybeSingle();
      const chatLink = chatRoom ? `/chat?roomId=${chatRoom.id}` : undefined;

      if (input.status === "selected") {
        await createNotification({
          userId: applicantSitter.user_id,
          type: "application_selected",
          title: "지원이 수락되었어요",
          content: "구인글 작성자의 예약이 완료될 때까지 기다려주세요.",
          linkUrl: chatLink,
        });
      } else {
        await createNotification({
          userId: applicantSitter.user_id,
          type: "application_rejected",
          title: "지원이 거절되었습니다",
          content:
            "아쉽지만 다음 기회를 기다려봐요. 다른 구인글도 확인해 보세요.",
          linkUrl: chatLink,
        });
      }
    }
  }

  return { data, reservationId };
}

export async function getMySitterApplications() {
  const user = await getAuthUser();
  if (!user)
    return { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, data: [] };

  const db = createServiceClient();

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sitterProfile)
    return { error: { code: "NOT_FOUND", message: "시터 정보를 찾을 수 없습니다." }, data: [] };

  const { data, error } = await db
    .from("applications")
    .select(
      `
      id, status, proposed_price, created_at,
      requests!inner(
        title, start_datetime, end_datetime, location, budget,
        users!requests_owner_id_fkey(full_name)
      )
    `,
    )
    .eq("sitter_id", sitterProfile.id)
    .order("created_at", { ascending: false });

  if (error)
    return { error: { code: "INTERNAL_ERROR", message: error.message }, data: [] };

  const pad = (n: number) => String(n).padStart(2, "0");
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  type RequestRow = {
    title: string;
    start_datetime: string | null;
    end_datetime: string | null;
    location: string | null;
    budget: number | null;
    users: { full_name: string } | null;
  };

  const applications = (data ?? []).map((a) => {
    const req = a.requests as RequestRow;
    const start = new Date(req?.start_datetime ?? "");
    const end = new Date(req?.end_datetime ?? "");
    const created = new Date(a.created_at ?? "");
    const dateStr = `${created.getFullYear()}${pad(created.getMonth() + 1)}${pad(created.getDate())}`;

    return {
      id: a.id,
      bookingNo: `AP-${dateStr}-${a.id.slice(-3).toUpperCase()}`,
      title: req?.title ?? "-",
      status: a.status,
      ownerName: req?.users?.full_name ?? "-",
      date: req?.start_datetime
        ? `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 (${DAYS[start.getDay()]})`
        : "-",
      time:
        req?.start_datetime && req?.end_datetime
          ? `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`
          : "-",
      location: req?.location ?? "-",
      price: a.proposed_price ?? req?.budget ?? 0,
    };
  });

  return { data: applications };
}

export async function updateApplicationByRoom(
  roomId: string,
  status: "selected" | "rejected",
  overrides?: {
    startDatetime?: string | null;
    endDatetime?: string | null;
    totalPrice?: number | null;
    location?: string | null;
  },
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

  return updateApplication(application.id, { status }, overrides);
}
