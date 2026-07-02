"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import {
  ProfilePopup,
  type ProfilePopupData,
  type Applicant,
  type Message,
  type ReservationRequest,
} from "@/components/common/chat/chat_components";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CustomModal } from "@/components/common/CustomModal";
import { CustomModalPayment } from "@/components/common/CustomModalPayment";
import CareRecordModal, {
  type CareRecordPayload,
} from "@/components/common/chat/CareRecordModal";
import {
  createCareRecord,
  getInProgressReservationByOwnerAndSitter,
} from "@/app/actions/care-records";
import {
  sendMessage,
  sendImageMessage,
  markRoomRead,
  sendSystemMessage,
  sendPaymentRequestMessage,
  sendAutoPaymentRequestMessage,
  sendPaymentCompleteMessage,
  sendApplicationSelectedMessage,
  sendApplicationRejectedMessage,
  sendServiceCompleteMessage,
  sendServiceStartMessage,
  sendReservationEditMessage,
  sendReservationEditResponseMessage,
} from "@/app/actions/chat";
import {
  ownerConfirmServiceComplete,
  getActiveReservationsForRoom,
  getReadyReservationsForRoom,
  getReservationStatuses,
  acceptReservationRequest,
  rejectReservationRequest,
  sitterStartService,
  getReservationRequestDetails,
  updateReservationDetails,
} from "@/app/actions/reservations";
import {
  ServiceCompleteModal,
  type ActiveReservation,
} from "@/components/common/chat/ServiceCompleteModal";
import { usePortOne } from "@/hooks/usePortOne";
import { uploadToCloudinary } from "@/utils/cloudinary";
import {
  updateApplicationByRoom,
  getRequestDetailsForReservation,
} from "@/app/actions/applications";
import { findOrCreateRoom } from "@/app/actions/chat";
import {
  createPayment,
  createExtraPayment,
  getActiveReservationBySitter,
  verifyAndConfirmPayment,
} from "@/app/actions/payments";
import {
  ReservationConfirmModal,
  type ReservationDetails,
} from "@/components/common/chat/ReservationConfirmModal";
import ReservationEditModal from "@/components/common/chat/ReservationEditModal";
import { useChatRooms } from "@/hooks/chat/useChatRooms";
import { useRequest } from "@/hooks/chat/useRequest";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useUserStore } from "@/store/userStore";

function getPaymentDeadline() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function withDateSeparators(msgs: Message[]): Message[] {
  const result: Message[] = [];
  let lastDateKey: string | null = null;
  for (const msg of msgs) {
    if (msg.rawDate) {
      const d = new Date(msg.rawDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (key !== lastDateKey) {
        const label = d.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        });
        result.push({
          id: `__date_${key}__`,
          from: "date_separator",
          text: label,
        });
        lastDateKey = key;
      }
    }
    result.push(msg);
  }
  return result;
}

function ChatPageContent({
  initialTab,
  initialRoomId,
}: {
  initialTab: "one_on_one" | "reservations" | "applicants";
  initialRoomId?: string | null;
}) {
  const router = useRouter();
  const { user, isLoading } = useUserStore();

  useEffect(() => {
    if (!isLoading && !user?.isVerified) {
      router.replace("/auth/verification");
    }
  }, [isLoading, user?.isVerified, router]);

  const [activeTab, setActiveTab] = useState<
    "one_on_one" | "reservations" | "applicants"
  >(initialTab);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(
    null,
  );
  const [selectedReservationRequestId, setSelectedReservationRequestId] =
    useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isLoadMoreRef = useRef(false);
  const scrollAnchorRef = useRef<number | null>(null);
  const desktopScrollAnchorRef = useRef<number | null>(null);
  const prevApplicantStatusRef = useRef<string | null | undefined>(null);

  const [applicationActionError, setApplicationActionError] = useState<
    string | null
  >(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationModalLoading, setReservationModalLoading] = useState(false);
  const [reservationDetails, setReservationDetails] =
    useState<ReservationDetails | null>(null);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);

  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptModalLoading, setAcceptModalLoading] = useState(false);
  const [acceptDetails, setAcceptDetails] = useState<ReservationDetails | null>(
    null,
  );
  const [pendingAcceptRoomId, setPendingAcceptRoomId] = useState<string | null>(
    null,
  );

  const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);

  const activeRoomId =
    activeTab === "one_on_one"
      ? selectedRoomId
      : activeTab === "reservations"
        ? selectedReservationRequestId
        : selectedApplicantId;

  const {
    rooms,
    applicants,
    reservationRequests,
    posts,
    loading,
    error,
    userId,
    deleteRoom,
    deleteApplicant,
    deleteReservationRequest,
    markRoomAsRead,
    updatePreview,
    updateApplicantStatus,
    updateReservationRequestStatus,
    refresh,
    acceptedDirectRoomId,
    clearAcceptedDirectRoomId,
  } = useChatRooms(activeRoomId);

  const {
    rejectedIds,
    confirmedIds,
    rejectApplicant,
    confirmApplicant,
    getApplicantBadge,
  } = useRequest(applicants);

  async function handleAcceptReservation(roomId: string) {
    const rr = reservationRequests.find((r) => r.id === roomId);
    if (!rr?.reservationId || actioningId) return;
    setPendingAcceptRoomId(roomId);
    setAcceptDetails(null);
    setAcceptModalOpen(true);
    setAcceptModalLoading(true);
    try {
      const result = await getReservationRequestDetails(rr.reservationId);
      if ("data" in result) {
        setAcceptDetails(result.data ?? null);
      }
    } catch {
    } finally {
      setAcceptModalLoading(false);
    }
  }

  async function handleAcceptConfirm() {
    const roomId = pendingAcceptRoomId;
    const rr = roomId ? reservationRequests.find((r) => r.id === roomId) : null;
    if (!rr?.reservationId || actioningId) return;
    setAcceptModalOpen(false);
    setActioningId(roomId);
    setApplicationActionError(null);
    try {
      const result = await acceptReservationRequest(rr.reservationId);
      if (result.error) {
        setApplicationActionError(result.error.message);
        return;
      }
      if (result.data) {
        broadcastReservationAccepted(result.data.room_id);
        refresh();
        setActiveTab("one_on_one");
        setSelectedRoomId(result.data.room_id);
        setSelectedReservationRequestId(null);
        setMobileChatView("room");
        setMessagesRefreshKey((k) => k + 1);
      }
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
      setPendingAcceptRoomId(null);
    }
  }

  async function handleRejectReservation(roomId: string) {
    const rr = reservationRequests.find((r) => r.id === roomId);
    if (!rr?.reservationId || actioningId) return;
    setActioningId(roomId);
    setApplicationActionError(null);
    try {
      const result = await rejectReservationRequest(rr.reservationId);
      if (result.error) {
        setApplicationActionError(result.error.message);
        return;
      }
      updateReservationRequestStatus(roomId, "canceled");
      if (result.data?.message) {
        addMessage(result.data.message);
      }
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  function handleDeleteReservationRequest(id: string) {
    setPendingDelete({ id, type: "reservation" });
    setDeleteError(null);
  }

  async function handleRejectApplicant(id: string) {
    if (actioningId) return;
    setActioningId(id);
    setApplicationActionError(null);
    try {
      const result = await updateApplicationByRoom(id, "rejected");
      if (result.error) {
        setApplicationActionError(result.error.message);
        return;
      }
      rejectApplicant(id);
      const msgResult = await sendApplicationRejectedMessage(id);
      if (msgResult.data) {
        addMessage(msgResult.data);
        broadcastMessage(msgResult.data);
        updatePreview(id, "지원 거절", msgResult.data.created_at ?? "");
      }
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleConfirmClick(id: string) {
    if (actioningId) return;
    setPendingConfirmId(id);
    setReservationDetails(null);
    setReservationModalOpen(true);
    setReservationModalLoading(true);
    try {
      const result = await getRequestDetailsForReservation(id);
      if ("error" in result && result.error) {
        setApplicationActionError(result.error.message);
        setReservationModalOpen(false);
        return;
      }
      if ("data" in result) {
        setReservationDetails(result.data);
      }
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
      setReservationModalOpen(false);
    } finally {
      setReservationModalLoading(false);
    }
  }

  async function handleConfirmApplicant(overrides: {
    startDatetime: string | null;
    endDatetime: string | null;
    totalPrice: number | null;
    location: string | null;
  }) {
    const id = pendingConfirmId;
    if (!id || actioningId) return;
    setReservationModalOpen(false);
    setActioningId(id);
    setApplicationActionError(null);
    try {
      const result = await updateApplicationByRoom(id, "selected", overrides);
      if (result.error) {
        setApplicationActionError(result.error.message);
        return;
      }
      const reservationId = "reservationId" in result ? result.reservationId : null;
      confirmApplicant(id);
      updateApplicantStatus(id, "selected");
      broadcastConfirmation();
      const confirmingApplicant = applicants.find((a) => a.id === id);
      const postTitle = confirmingApplicant
        ? (posts.find((p) => p.id === confirmingApplicant.postId)?.title ?? "")
        : "";
      const appData = {
        postTitle,
        postId: confirmingApplicant?.postId ?? "",
        sitterId: confirmingApplicant?.sitterId ?? "",
      };
      const msgResult = await sendApplicationSelectedMessage(id, appData);
      if (msgResult.data) {
        addMessage(msgResult.data);
        broadcastMessage(msgResult.data);
        updatePreview(id, "선택 확정", msgResult.data.created_at ?? "");
      }

      if (confirmingApplicant?.sitterId) {
        const roomResult = await findOrCreateRoom({
          sitter_id: confirmingApplicant.sitterId,
          room_type: "direct",
          reservation_id: reservationId ?? undefined,
        });
        if ("data" in roomResult && roomResult.data) {
          const newRoomId = roomResult.data.room_id;
          broadcastReservationAccepted(newRoomId);

          if (overrides.totalPrice && overrides.totalPrice > 0) {
            const deadline = getPaymentDeadline();
            const payResult = await sendAutoPaymentRequestMessage(newRoomId, {
              amount: overrides.totalPrice,
              reason: postTitle || "반려동물 정보",
              deadline,
              postId: confirmingApplicant?.postId,
            });
            if (payResult.data) {
              updatePreview(
                newRoomId,
                "결제 요청",
                payResult.data.created_at ?? "",
              );
            }
          }

          setActiveTab("one_on_one");
          setSelectedRoomId(newRoomId);
          setSelectedApplicantId(null);
          setMobileChatView("room");
        }
      }
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
      setPendingConfirmId(null);
    }
  }

  const {
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
  } = useChatMessages(activeRoomId, userId, messagesRefreshKey);

  const { requestPayment, isPending: isPaymentPending } = usePortOne();
  const [payingNow, setPayingNow] = useState(false);

  const lastPaymentReqId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from === "payment_request") return messages[i].id;
    }
    return null;
  }, [messages]);

  const isPaymentComplete = paymentState?.paid === true;
  const hasServiceStarted = useMemo(
    () => messages.some((m) => m.from === "service_start"),
    [messages],
  );
  const hasServiceCompleted = useMemo(
    () => messages.some((m) => m.from === "service_complete"),
    [messages],
  );

  useEffect(() => {
    if (!activeRoomId) return;
    markRoomAsRead(activeRoomId);
    markRoomRead(activeRoomId);
    setSendError(null);
    setConfirmedServiceIds(new Set());
    checkedReservationIdsRef.current = new Set();
  }, [activeRoomId, markRoomAsRead]);

  useLayoutEffect(() => {
    if (isLoadMoreRef.current) {
      isLoadMoreRef.current = false;
      const mobileEl = mobileScrollRef.current;
      if (scrollAnchorRef.current !== null && mobileEl) {
        mobileEl.scrollTop += mobileEl.scrollHeight - scrollAnchorRef.current;
        scrollAnchorRef.current = null;
      } else {
        const viewport = messagesEndRef.current?.closest(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLElement | null;
        if (viewport && desktopScrollAnchorRef.current !== null) {
          viewport.scrollTop +=
            viewport.scrollHeight - desktopScrollAnchorRef.current;
          desktopScrollAnchorRef.current = null;
        }
      }
      return;
    }
    const mobileEl = mobileScrollRef.current;
    if (mobileEl && mobileEl.offsetParent !== null) {
      mobileEl.scrollTop = mobileEl.scrollHeight;
      return;
    }
    const viewport = messagesEndRef.current?.closest(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  function handleLoadMore() {
    const mobileEl = mobileScrollRef.current;
    if (mobileEl && mobileEl.offsetParent !== null) {
      scrollAnchorRef.current = mobileEl.scrollHeight;
    } else {
      const viewport = messagesEndRef.current?.closest(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;
      if (viewport) desktopScrollAnchorRef.current = viewport.scrollHeight;
    }
    isLoadMoreRef.current = true;
    loadMore();
  }

  async function handlePaymentSubmit(data: {
    type: string;
    amount: number;
    reason: string;
  }) {
    if (!activeRoomId) return;
    const isBasePaid = paymentState?.paid === true || isPaymentAlreadyPaid;
    if (data.type !== "extra" && isBasePaid) {
      setSendError("이미 결제된 예약입니다. 추가금 요청을 이용해주세요.");
      return;
    }
    if (data.type === "extra" && !isBasePaid) {
      setSendError("기본 결제가 완료된 후 추가금 요청을 보낼 수 있습니다.");
      return;
    }
    try {
      const deadline = getPaymentDeadline();
      const isExtra = data.type === "extra";
      const reservationId = isExtra
        ? (selectedRoom?.reservationId ??
          (selectedRoom?.sitterId
            ? await getActiveReservationBySitter(selectedRoom.sitterId)
            : null))
        : undefined;
      const result = await sendPaymentRequestMessage(
        activeRoomId,
        {
          amount: data.amount,
          reason: data.reason,
          deadline,
          isExtra,
        },
        reservationId ?? undefined,
      );
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(activeRoomId, "결제 요청", result.data.created_at ?? "");
      }
    } catch {
      setSendError("결제 요청 전송에 실패했습니다. 다시 시도해주세요.");
    }
  }

  async function handlePayNow(data: { amount: number; reason: string; messageId: string }) {
    if (payingNow || isPaymentPending || !activeRoomId) return;
    setPayingNow(true);

    let portonePaymentId = `pay_${Date.now()}`;
    let totalAmount = Number(data.amount);
    let orderName = data.reason || "서비스 결제";

    const reservationId =
      selectedRoom?.reservationId ??
      (selectedRoom?.sitterId
        ? await getActiveReservationBySitter(selectedRoom.sitterId)
        : null);

    if (!reservationId) {
      setSendError("예약 정보를 찾을 수 없습니다.");
      setPayingNow(false);
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      setSendError("결제 금액이 올바르지 않습니다.");
      setPayingNow(false);
      return;
    }

    const payResult = await createPayment(reservationId, "CARD", totalAmount);
    if (payResult.error?.code === "FORBIDDEN") {
      const extraResult = await createExtraPayment(
        reservationId,
        totalAmount,
        data.reason ?? "추가 서비스",
      );
      if (extraResult.error) {
        setSendError(extraResult.error.message);
        setPayingNow(false);
        return;
      }
      portonePaymentId = extraResult.data!.payment_id;
      orderName = extraResult.data!.order_name;
    } else if (payResult.error) {
      setSendError(payResult.error.message);
      setPayingNow(false);
      return;
    } else {
      portonePaymentId = payResult.data!.payment_id;
      orderName = payResult.data!.order_name;
    }

    requestPayment(
      {
        paymentId: portonePaymentId,
        orderName,
        totalAmount,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl: `${window.location.origin}/payment/complete`,
      },
      {
        onSuccess: async () => {
          try {
            const verifyResult = await verifyAndConfirmPayment(portonePaymentId);
            if (verifyResult.error) {
              setSendError(verifyResult.error.message);
              return;
            }
            const result = await sendPaymentCompleteMessage(activeRoomId, {
              amount: totalAmount,
              paymentRequestMessageId: data.messageId,
            });
            if (result.data) {
              addMessage(result.data);
              broadcastMessage(result.data);
              updatePreview(
                activeRoomId,
                "결제 완료",
                result.data.created_at ?? "",
              );
            }
          } finally {
            setPayingNow(false);
          }
        },
        onFail: () => {
          setPayingNow(false);
        },
      },
    );
  }

  async function handleSend() {
    if (!input.trim() || !activeRoomId || sending) return;
    setSendError(null);
    setSending(true);
    try {
      const result = await sendMessage(activeRoomId, input.trim());
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);

        updatePreview(
          activeRoomId,
          result.data.content,
          result.data.created_at ?? "",
        );
      }
      setInput("");
    } catch {
      setSendError("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeRoomId || sendingPhoto) return;
    if (file.size > 10 * 1024 * 1024) {
      setSendError("10MB 이하의 이미지만 전송할 수 있습니다.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSendError("이미지 파일만 전송할 수 있습니다.");
      return;
    }
    setSendError(null);
    setSendingPhoto(true);
    try {
      const imageUrl = await uploadToCloudinary(file, "chats/photos");
      const result = await sendImageMessage(activeRoomId, imageUrl);
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(activeRoomId, "사진", result.data.created_at ?? "");
      }
    } catch {
      setSendError("사진 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSendingPhoto(false);
    }
  }

  const [mobileChatView, setMobileChatView] = useState<"list" | "room">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const hasAutoSelected = useRef(false);
  const hasRetried = useRef(false);
  const prevInitialRoomId = useRef<string | null | undefined>(null);
  useEffect(() => {
    if (prevInitialRoomId.current !== initialRoomId) {
      prevInitialRoomId.current = initialRoomId;
      hasAutoSelected.current = false;
      hasRetried.current = false;
    }
    if (!initialRoomId || hasAutoSelected.current || loading) return;
    const room = rooms.find((r) => r.id === initialRoomId);
    if (room) {
      hasAutoSelected.current = true;
      setActiveTab("one_on_one");
      setSelectedRoomId(room.id);
      setMobileChatView("room");
      return;
    }
    const applicant = applicants.find((a) => a.id === initialRoomId);
    if (applicant) {
      hasAutoSelected.current = true;
      setActiveTab("applicants");
      setSelectedApplicantId(applicant.id);
      setMobileChatView("room");
      return;
    }
    const rr = reservationRequests.find((r) => r.id === initialRoomId);
    if (rr) {
      hasAutoSelected.current = true;
      setActiveTab("reservations");
      setSelectedReservationRequestId(rr.id);
      setMobileChatView("room");
      return;
    }
    if (!hasRetried.current) {
      hasRetried.current = true;
      refresh();
    }
  }, [initialRoomId, rooms, applicants, reservationRequests, loading, refresh]);

  const [profilePopup, setProfilePopup] = useState<{
    data: ProfilePopupData;
    cardVariant: "sitter" | "owner";
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentReservationAmount, setPaymentReservationAmount] = useState<number | undefined>(undefined);
  const [isPaymentAlreadyPaid, setIsPaymentAlreadyPaid] = useState(false);
  const [careRecordOpen, setCareRecordOpen] = useState(false);
  const [confirmedServiceIds, setConfirmedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const checkedReservationIdsRef = useRef(new Set<string>());
  const [isServiceConfirming, setIsServiceConfirming] = useState(false);
  const [pendingServiceConfirmId, setPendingServiceConfirmId] = useState<
    string | null
  >(null);
  const [serviceCompleteModalOpen, setServiceCompleteModalOpen] =
    useState(false);
  const [activeReservations, setActiveReservations] = useState<
    ActiveReservation[]
  >([]);
  const [serviceCompleteModalLoading, setServiceCompleteModalLoading] =
    useState(false);
  const [serviceCompleteSending, setServiceCompleteSending] = useState(false);
  const [serviceStartModalOpen, setServiceStartModalOpen] = useState(false);
  const [readyReservations, setReadyReservations] = useState<
    ActiveReservation[]
  >([]);
  const [serviceStartModalLoading, setServiceStartModalLoading] =
    useState(false);
  const [serviceStartSending, setServiceStartSending] = useState(false);

  const [reservationEditOpen, setReservationEditOpen] = useState(false);

  const handleCareRecordSubmit = async (record: CareRecordPayload) => {
    if (!activeRoomId) return;
    try {
      let reservationId = record.reservationId;

      if (!reservationId && selectedRoom?.ownerId && selectedRoom?.sitterId) {
        const res = await getInProgressReservationByOwnerAndSitter(
          selectedRoom.ownerId,
          selectedRoom.sitterId,
        );
        if ("data" in res && res.data) reservationId = res.data.id;
      }

      if (reservationId) {
        await createCareRecord({ ...record, reservationId });
      }

      const content = `[돌봄기록] ${record.title}`;
      const result = await sendSystemMessage(activeRoomId, content);
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(activeRoomId, content, result.data.created_at ?? "");
      }
    } catch {
      setSendError("돌봄기록 전송에 실패했습니다. 다시 시도해주세요.");
    }
  };
  async function handleServiceStart() {
    if (!activeRoomId) return;
    setServiceStartModalLoading(true);
    setReadyReservations([]);
    setServiceStartModalOpen(true);
    try {
      const result = await getReadyReservationsForRoom(activeRoomId);
      if (result.error) {
        setServiceStartModalOpen(false);
        setSendError(result.error.message);
        return;
      }
      setReadyReservations(result.data ?? []);
    } catch {
      setServiceStartModalOpen(false);
      setSendError("예약 정보를 불러오는 데 실패했습니다.");
    } finally {
      setServiceStartModalLoading(false);
    }
  }

  async function handleServiceStartConfirm(reservationId: string) {
    if (!activeRoomId || serviceStartSending) return;
    setServiceStartSending(true);
    try {
      const startResult = await sitterStartService(reservationId);
      if (startResult.error) {
        setSendError(startResult.error.message);
        return;
      }
      const result = await sendServiceStartMessage(activeRoomId, reservationId);
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(
          activeRoomId,
          "서비스 시작",
          result.data.created_at ?? "",
        );
      }
      setServiceStartModalOpen(false);
    } catch {
      setSendError("서비스 시작 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setServiceStartSending(false);
    }
  }

  async function handleReservationEditSubmit(
    reservationId: string,
    proposed: {
      start_datetime: string;
      end_datetime: string;
      memo?: string | null;
    },
    original: {
      start_datetime: string;
      end_datetime: string;
      memo?: string | null;
    },
  ) {
    if (!activeRoomId) return;
    try {
      const result = await sendReservationEditMessage(activeRoomId, {
        reservationId,
        original,
        proposed,
      });
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(
          activeRoomId,
          "예약 수정 요청",
          result.data.created_at ?? "",
        );
      }
    } catch {
      setSendError("예약 수정 요청 전송에 실패했습니다. 다시 시도해주세요.");
    }
  }

  async function handleReservationEditConfirm(
    messageId: string,
    reservationId: string,
    proposed: {
      start_datetime: string;
      end_datetime: string;
      memo?: string | null;
    },
  ) {
    if (!activeRoomId) return;
    try {
      const updateResult = await updateReservationDetails(
        reservationId,
        proposed,
      );
      if (updateResult.error) {
        setSendError(updateResult.error.message);
        return;
      }
      const result = await sendReservationEditResponseMessage(activeRoomId, {
        originalMessageId: messageId,
        accepted: true,
      });
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(
          activeRoomId,
          "예약 수정 승인",
          result.data.created_at ?? "",
        );
      }
    } catch {
      setSendError("예약 수정에 실패했습니다. 다시 시도해주세요.");
    }
  }

  async function handleReservationEditReject(messageId: string) {
    if (!activeRoomId) return;
    try {
      const result = await sendReservationEditResponseMessage(activeRoomId, {
        originalMessageId: messageId,
        accepted: false,
      });
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(
          activeRoomId,
          "예약 수정 거절",
          result.data.created_at ?? "",
        );
      }
    } catch {
      setSendError("예약 수정 거절 전송에 실패했습니다. 다시 시도해주세요.");
    }
  }

  async function handleServiceComplete() {
    if (!activeRoomId) return;
    setServiceCompleteModalLoading(true);
    setActiveReservations([]);
    setServiceCompleteModalOpen(true);
    try {
      const result = await getActiveReservationsForRoom(activeRoomId);
      if (result.error) {
        setServiceCompleteModalOpen(false);
        setSendError(result.error.message);
        return;
      }
      setActiveReservations(result.data ?? []);
    } catch {
      setServiceCompleteModalOpen(false);
      setSendError("예약 정보를 불러오는데 실패했습니다.");
    } finally {
      setServiceCompleteModalLoading(false);
    }
  }

  async function handleServiceCompleteConfirm(reservationId: string) {
    if (!activeRoomId || serviceCompleteSending) return;
    setServiceCompleteSending(true);
    try {
      const result = await sendServiceCompleteMessage(
        activeRoomId,
        reservationId,
      );
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      if (result.data) {
        addMessage(result.data);
        broadcastMessage(result.data);
        updatePreview(
          activeRoomId,
          "서비스 완료",
          result.data.created_at ?? "",
        );
      }
      setServiceCompleteModalOpen(false);
    } catch {
      setSendError("서비스 완료 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setServiceCompleteSending(false);
    }
  }

  async function handleServiceConfirm(reservationId: string) {
    if (!reservationId || isServiceConfirming) return;
    setIsServiceConfirming(true);
    try {
      const result = await ownerConfirmServiceComplete(reservationId);
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      setConfirmedServiceIds((prev) => new Set([...prev, reservationId]));
      if (activeRoomId && result.completionMessage) {
        addMessage(result.completionMessage);
        broadcastMessage(result.completionMessage);
        updatePreview(
          activeRoomId,
          "서비스 완료 확정",
          result.completionMessage.created_at ?? "",
        );
      }
    } catch {
      setSendError("서비스 완료 확인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsServiceConfirming(false);
    }
  }

  useEffect(() => {
    const uncheckedIds = messages
      .filter(
        (m) =>
          m.from === "service_complete" &&
          !m.sentByMe &&
          m.serviceCompleteData?.reservationId &&
          !checkedReservationIdsRef.current.has(
            m.serviceCompleteData.reservationId,
          ),
      )
      .map((m) => m.serviceCompleteData!.reservationId);

    if (uncheckedIds.length === 0) return;
    uncheckedIds.forEach((id) => checkedReservationIdsRef.current.add(id));

    getReservationStatuses(uncheckedIds).then(({ data }) => {
      if (!data) return;
      const completed = Object.entries(data)
        .filter(([, status]) => status === "completed")
        .map(([id]) => id);
      if (completed.length > 0) {
        setConfirmedServiceIds((prev) => new Set([...prev, ...completed]));
      }
    });
  }, [messages]);

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    type: "room" | "applicant" | "reservation";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openApplicantProfile(id: string) {
    const a = applicants.find((a) => a.id === id);
    if (!a) return;
    setProfilePopup({
      data: {
        sitterId: a.sitterId,
        name: a.name,
        initial: a.initial,
        profileImage: a.profileImage,
        location: a.location,
        rating: a.rating,
        reviewCount: a.reviewCount,
        services: a.services,
        career: a.experience,
      },
      cardVariant: a.ownerId === userId ? "sitter" : "owner",
    });
  }

  function openReservationProfile(id: string) {
    const r = reservationRequests.find((r) => r.id === id);
    if (!r) return;
    setProfilePopup({
      data: {
        sitterId: r.sitterId,
        name: r.name,
        initial: r.initial,
        profileImage: r.profileImage,
      },
      cardVariant: r.ownerId === userId ? "sitter" : "owner",
    });
  }

  const selectedRoom =
    selectedRoomId !== null
      ? rooms.find((r) => r.id === selectedRoomId)
      : undefined;
  const selectedApplicant = applicants.find(
    (a) => a.id === selectedApplicantId,
  );

  useEffect(() => {
    if (!acceptedDirectRoomId) return;
    clearAcceptedDirectRoomId();
    setActiveTab("one_on_one");
    setSelectedRoomId(acceptedDirectRoomId);
    setSelectedReservationRequestId(null);
    setMobileChatView("room");
  }, [acceptedDirectRoomId, clearAcceptedDirectRoomId]);

  useEffect(() => {
    const currentStatus = selectedApplicant?.applicationStatus;
    const prevStatus = prevApplicantStatusRef.current;
    prevApplicantStatusRef.current = currentStatus;

    if (
      prevStatus !== "selected" &&
      currentStatus === "selected" &&
      selectedApplicantId
    ) {
      setMessagesRefreshKey((k) => k + 1);
    }
  }, [selectedApplicant?.applicationStatus, selectedApplicantId]);

  const filteredRooms = rooms.filter(
    (r) =>
      !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredApplicants = applicants.filter(
    (a) =>
      !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredPosts = posts.filter((p) =>
    filteredApplicants.some((a) => a.postId === p.id),
  );
  const filteredReservationRequests = reservationRequests.filter(
    (rr) =>
      !searchQuery || rr.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedReservationRequest = selectedReservationRequestId
    ? reservationRequests.find((rr) => rr.id === selectedReservationRequestId)
    : undefined;

  function handleDeleteRoom(id: string) {
    setPendingDelete({ id, type: "room" });
    setDeleteError(null);
  }

  function handleDeleteApplicant(id: string) {
    setPendingDelete({ id, type: "applicant" });
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result =
        pendingDelete.type === "room"
          ? await deleteRoom(pendingDelete.id)
          : pendingDelete.type === "reservation"
            ? await deleteReservationRequest(pendingDelete.id)
            : await deleteApplicant(pendingDelete.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      if (
        pendingDelete.type === "room" &&
        selectedRoomId === pendingDelete.id
      ) {
        setSelectedRoomId(null);
        setMobileChatView("list");
      }
      if (
        pendingDelete.type === "reservation" &&
        selectedReservationRequestId === pendingDelete.id
      ) {
        setSelectedReservationRequestId(null);
        setMobileChatView("list");
      }
      if (
        pendingDelete.type === "applicant" &&
        selectedApplicantId === pendingDelete.id
      ) {
        setSelectedApplicantId(null);
        setMobileChatView("list");
      }
      setPendingDelete(null);
    } catch {
      setDeleteError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  }

  function getHeaderBadge() {
    if (activeTab === "one_on_one")
      return { label: "진행중", className: "bg-orange-50 text-orange-500" };
    if (activeTab === "reservations") {
      const status = selectedReservationRequest?.reservationStatus;
      if (status === "canceled")
        return { label: "거절됨", className: "bg-stone-100 text-stone-500" };
      if (status === "accepted")
        return { label: "확정됨", className: "bg-green-50 text-green-600" };
      return { label: "대기 중", className: "bg-orange-50 text-orange-400" };
    }
    if (selectedApplicantId !== null && rejectedIds.has(selectedApplicantId))
      return { label: "거절됨", className: "bg-stone-100 text-stone-500" };
    if (
      confirmedIds.get(selectedApplicant?.postId ?? "") === selectedApplicantId
    )
      return { label: "선택됨", className: "bg-green-50 text-green-700" };
    return { label: "채팅중", className: "bg-orange-50 text-orange-500" };
  }

  function getHeaderSub() {
    if (activeTab === "one_on_one") return selectedRoom?.sub ?? "";
    if (activeTab === "reservations") {
      const status = selectedReservationRequest?.reservationStatus;
      if (status === "accepted") return "예약 요청 · 확정됨";
      if (status === "canceled") return "예약 요청 · 거절됨";
      return "예약 요청 · 대기 중";
    }
    if (
      confirmedIds.get(selectedApplicant?.postId ?? "") === selectedApplicantId
    )
      return "구인글 채팅 · 선택됨";
    if (selectedApplicantId !== null && rejectedIds.has(selectedApplicantId))
      return "구인글 채팅 · 거절됨";
    return "구인글 채팅 · 지원자";
  }

  function getReportUrl() {
    let targetId = "";
    let targetName = "";
    let targetImage: string | null = null;
    let role = "펫시터";

    if (activeTab === "one_on_one") {
      const isUserSitter = selectedRoom?.sitterId === userId;
      targetId = isUserSitter
        ? (selectedRoom?.ownerId ?? "")
        : (selectedRoom?.sitterId ?? "");
      targetName = selectedRoom?.name ?? "";
      targetImage = selectedRoom?.profileImage ?? null;
      role = isUserSitter ? "보호자" : "펫시터";
    } else if (activeTab === "reservations") {
      const isUserOwner = selectedReservationRequest?.ownerId === userId;
      targetId = isUserOwner
        ? (selectedReservationRequest?.sitterId ?? "")
        : (selectedReservationRequest?.ownerId ?? "");
      targetName = selectedReservationRequest?.name ?? "";
      targetImage = selectedReservationRequest?.profileImage ?? null;
      role = isUserOwner ? "펫시터" : "보호자";
    } else {
      const isUserSitter = selectedApplicant?.sitterId === userId;
      targetId = isUserSitter
        ? (selectedApplicant?.ownerId ?? "")
        : (selectedApplicant?.sitterId ?? "");
      targetName = isUserSitter ? "" : (selectedApplicant?.name ?? "");
      targetImage = isUserSitter
        ? null
        : (selectedApplicant?.profileImage ?? null);
      role = isUserSitter ? "보호자" : "펫시터";
    }

    const service = getHeaderSub();
    const params = new URLSearchParams();
    if (targetId) params.set("targetId", targetId);
    if (targetName) params.set("targetName", targetName);
    params.set("role", role);
    if (service) params.set("service", service);
    if (targetImage) params.set("targetImage", targetImage);
    return `/myprofile/report?${params.toString()}`;
  }

  const roomName =
    activeTab === "one_on_one"
      ? (selectedRoom?.name ?? "")
      : activeTab === "reservations"
        ? (selectedReservationRequest?.name ?? "")
        : (selectedApplicant?.name ?? "");
  const roomInitial =
    activeTab === "one_on_one"
      ? (selectedRoom?.initial ?? "")
      : activeTab === "reservations"
        ? (selectedReservationRequest?.initial ?? "")
        : (selectedApplicant?.initial ?? "");
  const roomProfileImage =
    activeTab === "one_on_one"
      ? (selectedRoom?.profileImage ?? null)
      : activeTab === "reservations"
        ? (selectedReservationRequest?.profileImage ?? null)
        : (selectedApplicant?.profileImage ?? null);
  const headerBadge = getHeaderBadge();
  const headerSub = getHeaderSub();

  const isCurrentUserSitter =
    userId !== null &&
    activeTab === "one_on_one" &&
    selectedRoom !== undefined &&
    selectedRoom.ownerId !== null &&
    selectedRoom.ownerId !== userId;

  const isOwnerOfSelectedRoom =
    selectedApplicant?.ownerId !== null &&
    selectedApplicant?.ownerId === userId;

  const showApplicantActions =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    isOwnerOfSelectedRoom &&
    !rejectedIds.has(selectedApplicantId) &&
    confirmedIds.get(selectedApplicant?.postId ?? "") !== selectedApplicantId &&
    !confirmedIds.has(selectedApplicant?.postId ?? "");

  const isRejectedApplicant =
    activeTab === "applicants" &&
    !isOwnerOfSelectedRoom &&
    selectedApplicantId !== null &&
    rejectedIds.has(selectedApplicantId);

  const confirmedPostTitle = selectedApplicant
    ? (posts.find((p) => p.id === selectedApplicant.postId)?.title ?? "")
    : "";

  const syntheticCardRef = useRef<{ roomId: string | null; insertAt: number }>({
    roomId: null,
    insertAt: 0,
  });

  const processedMessages = useMemo(() => {
    const fillPostTitles = (msgs: typeof messages) =>
      msgs.map((msg) => {
        if (
          msg.from === "application_selected" &&
          msg.applicationData &&
          !msg.applicationData.postTitle &&
          msg.applicationData.postId
        ) {
          const post = posts.find((p) => p.id === msg.applicationData!.postId);
          if (post) {
            return {
              ...msg,
              applicationData: {
                ...msg.applicationData,
                postTitle: post.title,
              },
            };
          }
        }
        return msg;
      });

    if (activeTab !== "applicants" || !selectedApplicant)
      return withDateSeparators(messages);
    const hasCard = messages.some(
      (m) =>
        m.from === "application_selected" || m.from === "application_rejected",
    );
    if (hasCard) return withDateSeparators(fillPostTitles(messages));

    const status = selectedApplicant.applicationStatus;
    if (status !== "selected" && status !== "rejected")
      return withDateSeparators(messages);

    if (hasMore) return withDateSeparators(messages);

    if (
      syntheticCardRef.current.roomId !== selectedApplicant.id ||
      messages.length === 0
    ) {
      if (messages.length === 0) {
        syntheticCardRef.current = { roomId: null, insertAt: 0 };
        return withDateSeparators(messages);
      }
      syntheticCardRef.current = {
        roomId: selectedApplicant.id,
        insertAt: messages.length,
      };
    }

    const insertAt = Math.min(
      syntheticCardRef.current.insertAt,
      messages.length,
    );
    const card =
      status === "selected"
        ? {
            id: "__synthetic_selected__",
            from: "application_selected" as const,
            text: "",
            applicationData: {
              postTitle: confirmedPostTitle,
              postId: selectedApplicant.postId,
              sitterId: selectedApplicant.sitterId ?? "",
              sentByMe: isOwnerOfSelectedRoom,
            },
          }
        : {
            id: "__synthetic_rejected__",
            from: "application_rejected" as const,
            text: "",
            applicationData: {
              postTitle: "",
              postId: "",
              sitterId: "",
              sentByMe: isOwnerOfSelectedRoom,
            },
          };

    return withDateSeparators(
      fillPostTitles([
        ...messages.slice(0, insertAt),
        card,
        ...messages.slice(insertAt),
      ]),
    );
  }, [
    messages,
    hasMore,
    activeTab,
    selectedApplicant,
    confirmedPostTitle,
    isOwnerOfSelectedRoom,
    posts,
  ]);

  function handleGoToChat(isMobile: boolean) {
    const room = rooms.find(
      (r) =>
        r.ownerId === selectedApplicant?.ownerId &&
        r.sitterId === selectedApplicant?.sitterId,
    );
    setActiveTab("one_on_one");
    setSelectedApplicantId(null);
    if (room) setSelectedRoomId(room.id);
    if (isMobile) setMobileChatView(room ? "room" : "list");
  }

  const leaveChat = () => {
    if (activeTab === "one_on_one" && selectedRoomId !== null)
      handleDeleteRoom(selectedRoomId);
    else if (
      activeTab === "reservations" &&
      selectedReservationRequestId !== null
    )
      handleDeleteReservationRequest(selectedReservationRequestId);
    else if (activeTab === "applicants" && selectedApplicantId !== null)
      handleDeleteApplicant(selectedApplicantId);
  };

  const sharedSidebarProps = {
    activeTab,
    searchQuery,
    loading,
    error,
    userId,
    filteredRooms,
    filteredApplicants,
    filteredPosts,
    filteredReservationRequests,
    totalRoomCount: rooms.length,
    totalApplicantCount: applicants.length,
    totalReservationCount: reservationRequests.length,
    applicants,
    selectedRoomId,
    selectedApplicantId,
    selectedReservationRequestId,
    rejectedIds,
    confirmedIds,
    actioningId,
    getApplicantBadge,
    onSearchChange: setSearchQuery,
    onDeleteRoom: handleDeleteRoom,
    onDeleteApplicant: handleDeleteApplicant,
    onDeleteReservationRequest: handleDeleteReservationRequest,
    onRejectReservation: handleRejectReservation,
    onAcceptReservation: handleAcceptReservation,
    onRejectApplicant: handleRejectApplicant,
    onConfirm: handleConfirmClick,
    onAvatarClick: openApplicantProfile,
    onReservationAvatarClick: openReservationProfile,
  };

  const sharedChatWindowProps = {
    roomName,
    roomInitial,
    roomProfileImage,
    headerSub,
    headerBadge,
    activeTab,
    selectedApplicantPostId: selectedApplicant?.postId,
    messages: processedMessages,
    mobileScrollRef,
    messagesEndRef,
    hasMore,
    loadingMore,
    paymentState,
    lastPaymentReqId,
    confirmedEditIds,
    confirmedServiceIds,
    payingNow,
    isPaymentPending,
    isServiceConfirming,
    isCurrentUserSitter,
    isPaymentComplete,
    hasServiceStarted,
    hasServiceCompleted,
    input,
    sending,
    sendError,
    isRejectedApplicant,
    showApplicantActions,
    applicationActionError,
    actioningId,
    onLeaveChat: leaveChat,
    onReport: () => router.push(getReportUrl()),
    onNavigateToPost: (postId: string) => router.push(`/board/${postId}`),
    onSetInput: setInput,
    onSend: handleSend,
    onLoadMore: handleLoadMore,
    onPayNow: handlePayNow,
    onOpenPaymentModal: async () => {
      if (activeRoomId) {
        const result = await getActiveReservationsForRoom(activeRoomId);
        if ("data" in result && result.data && result.data.length > 0) {
          const reservation = result.data[0];
          setPaymentReservationAmount(reservation.totalPrice);
          setIsPaymentAlreadyPaid(reservation.isBasePaid);
        } else {
          setIsPaymentAlreadyPaid(paymentState?.paid === true);
        }
      } else {
        setIsPaymentAlreadyPaid(paymentState?.paid === true);
      }
      setPaymentModalOpen(true);
    },
    onOpenCareRecord: () => setCareRecordOpen(true),
    onServiceStart: handleServiceStart,
    onServiceComplete: handleServiceComplete,
    onOpenReservationEdit: () => setReservationEditOpen(true),
    onPhotoClick: () => photoInputRef.current?.click(),
    onServiceConfirm: (id: string) => setPendingServiceConfirmId(id),
    onReservationEditConfirm: handleReservationEditConfirm,
    onReservationEditReject: handleReservationEditReject,
    onRejectApplicant: () => handleRejectApplicant(selectedApplicantId!),
    onConfirmApplicant: () => handleConfirmClick(selectedApplicantId!),
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />

      {/* 모바일 */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {mobileChatView === "list" ? (
          <ChatSidebar
            {...sharedSidebarProps}
            className="flex flex-col h-full"
            isMobile
            onTabChange={(tab) => {
              setActiveTab(tab);
              setMobileChatView("list");
            }}
            onRoomSelect={(id) => {
              setSelectedRoomId(id);
              setMobileChatView("room");
            }}
            onApplicantSelect={(id) => {
              setSelectedApplicantId(id);
              setMobileChatView("room");
            }}
            onReservationSelect={(id) => {
              setSelectedReservationRequestId(id);
              setMobileChatView("room");
            }}
          />
        ) : (
          <ChatWindow
            {...sharedChatWindowProps}
            isMobile
            loading={false}
            error={null}
            isEmpty={false}
            hasSelection={true}
            onBack={() => setMobileChatView("list")}
            onGoToProfile={() => {
              const sitterId =
                activeTab === "one_on_one"
                  ? selectedRoom?.sitterId
                  : selectedApplicant?.sitterId;
              if (sitterId) router.push(`/petsitters/${sitterId}`);
            }}
            onGoToChat={() => handleGoToChat(true)}
          />
        )}
      </div>

      {/* 데스크톱 */}
      <div className="hidden md:flex flex-1 bg-orange-50 overflow-hidden">
        <ChatSidebar
          {...sharedSidebarProps}
          className="w-96 bg-white border-r border-orange-100 flex flex-col shrink-0"
          onTabChange={setActiveTab}
          onRoomSelect={setSelectedRoomId}
          onApplicantSelect={setSelectedApplicantId}
          onReservationSelect={setSelectedReservationRequestId}
        />
        <ChatWindow
          {...sharedChatWindowProps}
          isMobile={false}
          loading={loading}
          error={error}
          isEmpty={
            (activeTab === "one_on_one" && rooms.length === 0) ||
            (activeTab === "applicants" && applicants.length === 0) ||
            (activeTab === "reservations" && reservationRequests.length === 0)
          }
          hasSelection={
            !(
              (activeTab === "one_on_one" && selectedRoomId === null) ||
              (activeTab === "applicants" && selectedApplicantId === null) ||
              (activeTab === "reservations" &&
                selectedReservationRequestId === null)
            )
          }
          onBack={() => {}}
          onGoToProfile={() => {
            const sitterId =
              activeTab === "one_on_one"
                ? selectedRoom?.sitterId
                : activeTab === "reservations"
                  ? selectedReservationRequest?.sitterId
                  : selectedApplicant?.sitterId;
            if (sitterId) router.push(`/petsitters/${sitterId}`);
          }}
          onGoToChat={() => handleGoToChat(false)}
        />
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
        disabled={sendingPhoto}
      />

      {profilePopup && (
        <ProfilePopup
          data={profilePopup.data}
          cardVariant={profilePopup.cardVariant}
          onClose={() => setProfilePopup(null)}
        />
      )}

      <CustomModal
        open={pendingServiceConfirmId !== null}
        preset="serviceComplete"
        confirmText={isServiceConfirming ? "처리 중..." : "완료 확인"}
        onClose={() => {
          if (!isServiceConfirming) setPendingServiceConfirmId(null);
        }}
        onConfirm={() => {
          if (pendingServiceConfirmId) {
            handleServiceConfirm(pendingServiceConfirmId).then(() =>
              setPendingServiceConfirmId(null),
            );
          }
        }}
      />

      <CustomModal
        open={pendingDelete !== null}
        preset="leaveChat"
        confirmText={deleting ? "처리 중..." : "나가기"}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        description={
          deleteError
            ? deleteError
            : "채팅방을 나가면 대화 내역을 다시 볼 수 없습니다."
        }
      />

      <CustomModalPayment
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentAmount={paymentReservationAmount}
        isAlreadyPaid={isPaymentAlreadyPaid || paymentState?.paid === true}
        onSubmit={handlePaymentSubmit}
      />

      <CareRecordModal
        open={careRecordOpen}
        onClose={() => setCareRecordOpen(false)}
        serviceType="care"
        reservationId={selectedRoom?.reservationId ?? undefined}
        onSubmit={handleCareRecordSubmit}
      />

      <ReservationConfirmModal
        open={reservationModalOpen}
        sitterName={
          pendingConfirmId
            ? (applicants.find((a) => a.id === pendingConfirmId)?.name ?? "")
            : ""
        }
        details={reservationDetails}
        loading={reservationModalLoading}
        confirming={!!actioningId}
        onClose={() => {
          setReservationModalOpen(false);
          setPendingConfirmId(null);
        }}
        onConfirm={handleConfirmApplicant}
      />

      <ReservationConfirmModal
        open={acceptModalOpen}
        sitterName={
          pendingAcceptRoomId
            ? (reservationRequests.find((rr) => rr.id === pendingAcceptRoomId)
                ?.name ?? "")
            : ""
        }
        details={acceptDetails}
        loading={acceptModalLoading}
        confirming={!!actioningId}
        hideEdit
        confirmLabel="수락"
        onClose={() => {
          setAcceptModalOpen(false);
          setPendingAcceptRoomId(null);
        }}
        onConfirm={() => {
          void handleAcceptConfirm();
        }}
      />

      <ServiceCompleteModal
        open={serviceCompleteModalOpen}
        reservations={activeReservations}
        loading={serviceCompleteModalLoading}
        sending={serviceCompleteSending}
        onClose={() => setServiceCompleteModalOpen(false)}
        onConfirm={handleServiceCompleteConfirm}
      />

      <ServiceCompleteModal
        variant="start"
        open={serviceStartModalOpen}
        reservations={readyReservations}
        loading={serviceStartModalLoading}
        sending={serviceStartSending}
        onClose={() => setServiceStartModalOpen(false)}
        onConfirm={handleServiceStartConfirm}
      />

      <ReservationEditModal
        open={reservationEditOpen && !!activeRoomId}
        roomId={activeRoomId ?? ""}
        onClose={() => setReservationEditOpen(false)}
        onSubmit={handleReservationEditSubmit}
      />
    </div>
  );
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "applicants"
      ? "applicants"
      : tabParam === "reservations"
        ? "reservations"
        : "one_on_one";
  const initialRoomId = searchParams.get("roomId");
  return (
    <ChatPageContent initialTab={initialTab} initialRoomId={initialRoomId} />
  );
}
