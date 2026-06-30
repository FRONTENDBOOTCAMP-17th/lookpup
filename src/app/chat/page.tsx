"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, MoreVertical, Send, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatRoomItem,
  ChatWindowHeader,
  MessageBubble,
  ChatInput,
  ChatPlusPanel,
  ApplicantProfilePopup,
  ApplicantPostGroup,
  ReservationRequestCard,
  type Applicant,
  type ReservationRequest,
} from "@/components/common/chat/chat_components";
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
  getAcceptedReservationBySitter,
} from "@/app/actions/payments";
import {
  ReservationConfirmModal,
  type ReservationDetails,
} from "@/components/common/chat/ReservationConfirmModal";
import { useChatRooms } from "@/hooks/chat/useChatRooms";
import { useRequest } from "@/hooks/chat/useRequest";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useUserStore } from "@/store/userStore";

function getPaymentDeadline() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
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

  const [editMode, setEditMode] = useState(false);
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
      // 에러 시에도 모달은 유지 (details=null이면 "정보를 불러오지 못했습니다" 표시)
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
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDeleteReservationRequest(id: string) {
    const result = await deleteReservationRequest(id);
    if (result.error) {
      setSendError(result.error);
      return;
    }
    if (selectedReservationRequestId === id) {
      setSelectedReservationRequestId(null);
      setMobileChatView("list");
    }
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
        });
        if ("data" in roomResult && roomResult.data) {
          const newRoomId = roomResult.data.room_id;

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
  } = useChatMessages(activeRoomId, userId, messagesRefreshKey);

  const { requestPayment, isPending: isPaymentPending } = usePortOne();
  const [payingNow, setPayingNow] = useState(false);

  const lastPaymentReqId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from === "payment_request") return messages[i].id;
    }
    return null;
  }, [messages]);

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
    try {
      const deadline = getPaymentDeadline();
      const result = await sendPaymentRequestMessage(activeRoomId, {
        amount: data.amount,
        reason: data.reason,
        deadline,
      });
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

  async function handlePayNow() {
    if (!paymentState || payingNow || isPaymentPending || !activeRoomId) return;
    setPayingNow(true);

    let portonePaymentId = `pay_${Date.now()}`;
    let totalAmount = Number(paymentState.amount);
    let orderName = paymentState.reason || "서비스 결제";

    const reservationId =
      selectedRoom?.reservationId ??
      (selectedRoom?.sitterId
        ? await getAcceptedReservationBySitter(selectedRoom.sitterId)
        : null);

    if (reservationId) {
      const payResult = await createPayment(reservationId, "CARD");
      if (payResult.error?.code === "FORBIDDEN") {
        const extraResult = await createExtraPayment(
          reservationId,
          totalAmount,
          paymentState.reason ?? "추가 서비스",
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
        totalAmount = payResult.data!.amount;
        orderName = payResult.data!.order_name;
      }
    }

    if (!totalAmount || totalAmount <= 0) {
      setSendError("결제 금액이 올바르지 않습니다.");
      setPayingNow(false);
      return;
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
            const result = await sendPaymentCompleteMessage(activeRoomId, {
              amount: totalAmount,
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
    setPlusMenuOpen(false);
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
  useEffect(() => {
    if (!initialRoomId || hasAutoSelected.current || loading) return;
    hasAutoSelected.current = true;
    const room = rooms.find((r) => r.id === initialRoomId);
    if (room) {
      setActiveTab("one_on_one");
      setSelectedRoomId(room.id);
      setMobileChatView("room");
      return;
    }
    const applicant = applicants.find((a) => a.id === initialRoomId);
    if (applicant) {
      setActiveTab("applicants");
      setSelectedApplicantId(applicant.id);
      setMobileChatView("room");
      return;
    }
    const rr = reservationRequests.find((r) => r.id === initialRoomId);
    if (rr) {
      setActiveTab("reservations");
      setSelectedReservationRequestId(rr.id);
      setMobileChatView("room");
    }
  }, [initialRoomId, rooms, applicants, reservationRequests, loading]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePopupApplicant, setProfilePopupApplicant] =
    useState<Applicant | null>(null);
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());
  const togglePostCollapse = (postId: string) =>
    setCollapsedPosts((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });

  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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
    setPlusMenuOpen(false);
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

  async function handleServiceComplete() {
    if (!activeRoomId) return;
    setPlusMenuOpen(false);
    setServiceCompleteModalLoading(true);
    setActiveReservations([]);
    setServiceCompleteModalOpen(true);
    try {
      const result = await getActiveReservationsForRoom(activeRoomId);
      if (result.error) {
        setSendError(result.error.message);
        return;
      }
      setActiveReservations(result.data ?? []);
    } catch {
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
    type: "room" | "applicant";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openApplicantProfile(id: string) {
    const found = applicants.find((a) => a.id === id) ?? null;
    setProfilePopupApplicant(found);
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
        pendingDelete.type === "applicant" &&
        selectedApplicantId === pendingDelete.id
      ) {
        setSelectedApplicantId(null);
        setMobileChatView("list");
      }
      setPendingDelete(null);
      setMobileMenuOpen(false);
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

  const mobileRoomName =
    activeTab === "one_on_one"
      ? (selectedRoom?.name ?? "")
      : activeTab === "reservations"
        ? (selectedReservationRequest?.name ?? "")
        : (selectedApplicant?.name ?? "");
  const mobileRoomInitial =
    activeTab === "one_on_one"
      ? (selectedRoom?.initial ?? "")
      : activeTab === "reservations"
        ? (selectedReservationRequest?.initial ?? "")
        : (selectedApplicant?.initial ?? "");
  const mobileRoomProfileImage =
    activeTab === "one_on_one"
      ? (selectedRoom?.profileImage ?? null)
      : activeTab === "reservations"
        ? (selectedReservationRequest?.profileImage ?? null)
        : (selectedApplicant?.profileImage ?? null);
  const headerBadge = getHeaderBadge();

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

  const displayMessages = useMemo(() => {
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

    if (activeTab !== "applicants" || !selectedApplicant) return messages;
    const hasCard = messages.some(
      (m) =>
        m.from === "application_selected" || m.from === "application_rejected",
    );
    if (hasCard) return fillPostTitles(messages);

    const status = selectedApplicant.applicationStatus;
    if (status !== "selected" && status !== "rejected") return messages;

    if (hasMore) return messages;

    if (
      syntheticCardRef.current.roomId !== selectedApplicant.id ||
      messages.length === 0
    ) {
      if (messages.length === 0) {
        syntheticCardRef.current = { roomId: null, insertAt: 0 };
        return messages;
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

    return fillPostTitles([
      ...messages.slice(0, insertAt),
      card,
      ...messages.slice(insertAt),
    ]);
  }, [
    messages,
    hasMore,
    activeTab,
    selectedApplicant,
    confirmedPostTitle,
    isOwnerOfSelectedRoom,
    posts,
  ]);

  function withDateSeparators(msgs: typeof displayMessages) {
    const result: typeof displayMessages = [];
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

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />

      {/* ── 모바일 레이아웃 (md 미만) ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {mobileChatView === "list" ? (
          /* 채팅 목록 뷰 */
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="px-5 pt-5 bg-white border-b border-orange-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-900">채팅</h2>
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className={`text-sm font-medium transition-colors ${editMode ? "text-stone-900" : "text-orange-500"}`}
                >
                  {editMode ? "완료" : "편집"}
                </button>
              </div>
              {/* 탭 */}
              <div className="flex">
                {(["one_on_one", "reservations", "applicants"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setEditMode(false);
                        setMobileChatView("list");
                      }}
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? "border-orange-500 text-orange-500"
                          : "border-transparent text-gray-400"
                      }`}
                    >
                      {tab === "one_on_one"
                        ? "1:1 채팅"
                        : tab === "reservations"
                          ? "예약 목록"
                          : "지원 목록"}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* 검색창 */}
            <div className="px-5 py-3 bg-white border-b border-orange-100 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 rounded-xl">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="채팅방 검색"
                  className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-900/50 outline-none"
                />
              </div>
            </div>

            {/* 목록 */}
            <ScrollArea className="flex-1 overflow-hidden">
              {loading && (
                <p className="text-center text-stone-400 text-sm pt-16">
                  불러오는 중...
                </p>
              )}
              {!loading && error && (
                <p className="text-center text-stone-400 text-sm pt-16">
                  {error}
                </p>
              )}
              {!loading &&
                !error &&
                activeTab === "one_on_one" &&
                rooms.length === 0 && (
                  <p className="text-center text-stone-400 text-sm pt-16">
                    새로운 채팅이 존재하지 않습니다
                  </p>
                )}
              {!loading &&
                !error &&
                activeTab === "applicants" &&
                applicants.length === 0 && (
                  <p className="text-center text-stone-400 text-sm pt-16">
                    새로운 채팅이 존재하지 않습니다
                  </p>
                )}
              {!loading &&
                !error &&
                activeTab === "reservations" &&
                reservationRequests.length === 0 && (
                  <p className="text-center text-stone-400 text-sm pt-16">
                    예약 요청이 없습니다
                  </p>
                )}
              {activeTab === "one_on_one" &&
                filteredRooms.map((room) => (
                  <ChatRoomItem
                    key={room.id}
                    room={room}
                    isSelected={false}
                    editMode={editMode}
                    onDelete={handleDeleteRoom}
                    onClick={(id) => {
                      setSelectedRoomId(id);
                      setMobileChatView("room");
                    }}
                  />
                ))}

              {activeTab === "reservations" &&
                filteredReservationRequests.map((rr) => (
                  <ReservationRequestCard
                    key={rr.id}
                    reservationRequest={rr}
                    isSelected={false}
                    editMode={editMode}
                    isSitter={rr.ownerId !== userId}
                    actioningId={actioningId}
                    onSelect={(id) => {
                      setSelectedReservationRequestId(id);
                      setMobileChatView("room");
                    }}
                    onReject={handleRejectReservation}
                    onAccept={handleAcceptReservation}
                    onDelete={handleDeleteReservationRequest}
                  />
                ))}

              {activeTab === "applicants" && (
                <>
                  {filteredPosts.map((post) => (
                    <ApplicantPostGroup
                      key={post.id}
                      post={post}
                      applicants={filteredApplicants.filter(
                        (a) => a.postId === post.id,
                      )}
                      isCollapsed={collapsedPosts.has(post.id)}
                      isOwner={
                        applicants.find((a) => a.postId === post.id)
                          ?.ownerId === userId
                      }
                      selectedApplicantId={selectedApplicantId}
                      rejectedIds={rejectedIds}
                      confirmedId={confirmedIds.get(post.id) ?? null}
                      editMode={editMode}
                      onToggle={() => togglePostCollapse(post.id)}
                      onDelete={handleDeleteApplicant}
                      onReject={handleRejectApplicant}
                      onConfirm={handleConfirmClick}
                      onSelect={(id) => {
                        setSelectedApplicantId(id);
                        setMobileChatView("room");
                      }}
                      onAvatarClick={openApplicantProfile}
                      getApplicantBadge={getApplicantBadge}
                    />
                  ))}
                </>
              )}
            </ScrollArea>
          </div>
        ) : (
          /* 채팅방 뷰 */
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="h-14 px-4 bg-white border-b border-orange-100 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileChatView("list")}
                className="p-1 -ml-1"
              >
                <ChevronLeft size={24} className="text-stone-900" />
              </button>
              <Avatar
                initial={mobileRoomInitial}
                src={mobileRoomProfileImage}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-stone-900 truncate">
                  {mobileRoomName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {getHeaderSub()}
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${headerBadge.className}`}
              >
                {headerBadge.label}
              </span>
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  className="p-1"
                >
                  <MoreVertical size={20} className="text-gray-500" />
                </button>
                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-orange-100 z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          const sitterId =
                            activeTab === "one_on_one"
                              ? selectedRoom?.sitterId
                              : selectedApplicant?.sitterId;
                          if (sitterId) router.push(`/petsitters/${sitterId}`);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors"
                      >
                        프로필로 이동하기
                      </button>
                      <button
                        onClick={() => {
                          if (
                            activeTab === "one_on_one" &&
                            selectedRoomId !== null
                          )
                            handleDeleteRoom(selectedRoomId);
                          else if (
                            activeTab === "reservations" &&
                            selectedReservationRequestId !== null
                          )
                            handleDeleteReservationRequest(
                              selectedReservationRequestId,
                            );
                          else if (
                            activeTab === "applicants" &&
                            selectedApplicantId !== null
                          )
                            handleDeleteApplicant(selectedApplicantId);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors border-t border-orange-50"
                      >
                        채팅 나가기
                      </button>
                      <button
                        onClick={() => {
                          router.push(getReportUrl());
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-orange-50"
                      >
                        신고하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 메시지 영역 */}
            <div
              ref={mobileScrollRef}
              className="flex-1 min-h-0 overflow-y-auto bg-orange-50"
            >
              <div
                className="px-4 py-4 flex flex-col gap-4"
                onClick={() => {
                  if (plusMenuOpen) setPlusMenuOpen(false);
                }}
              >
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="text-sm text-orange-500 disabled:text-stone-400"
                    >
                      {loadingMore ? "불러오는 중..." : "이전 메시지 더 보기"}
                    </button>
                  </div>
                )}
                {withDateSeparators(displayMessages).map((msg) => {
                  const postId =
                    msg.applicationData?.postId ||
                    msg.paymentData?.postId ||
                    selectedApplicant?.postId;
                  // 메시지별 결제 완료 여부: 마지막 요청이면 파생 상태, 이전 요청이면 항상 true(비활성)
                  const isThisPaymentPaid =
                    msg.from === "payment_request"
                      ? msg.id === lastPaymentReqId
                        ? (paymentState?.paid ?? false)
                        : true
                      : false;
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      senderInitial={mobileRoomInitial}
                      senderProfileImage={mobileRoomProfileImage}
                      isCurrentUserSitter={isCurrentUserSitter}
                      onPaymentRequest={handlePayNow}
                      isPaymentPending={payingNow || isPaymentPending}
                      isPaymentPaid={isThisPaymentPaid}
                      onPostClick={
                        postId
                          ? () => router.push(`/board/${postId}`)
                          : undefined
                      }
                      onGoToChat={() => {
                        const room = rooms.find(
                          (r) =>
                            r.ownerId === selectedApplicant?.ownerId &&
                            r.sitterId === selectedApplicant?.sitterId,
                        );
                        setActiveTab("one_on_one");
                        setSelectedApplicantId(null);
                        if (room) setSelectedRoomId(room.id);
                        setMobileChatView(room ? "room" : "list");
                      }}
                      onServiceConfirm={(id) => setPendingServiceConfirmId(id)}
                      isServiceConfirmed={
                        !!msg.serviceCompleteData?.reservationId &&
                        confirmedServiceIds.has(
                          msg.serviceCompleteData.reservationId,
                        )
                      }
                      isServiceConfirming={isServiceConfirming}
                    />
                  );
                })}
              </div>
            </div>

            {/* 지원자 거절/확정 버튼 */}
            {showApplicantActions && (
              <div className="px-4 py-2.5 bg-white border-t border-orange-100 flex flex-col gap-1 shrink-0">
                {applicationActionError && (
                  <p className="text-xs text-red-500 px-1">
                    {applicationActionError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRejectApplicant(selectedApplicantId!)}
                    disabled={!!actioningId}
                    className="flex-1 py-2 text-sm text-gray-500 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleConfirmClick(selectedApplicantId!)}
                    disabled={!!actioningId}
                    className="flex-1 py-2 text-sm text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
                  >
                    선택 확정
                  </button>
                </div>
              </div>
            )}

            {/* + 버튼 패널 */}
            {plusMenuOpen && (
              <ChatPlusPanel
                onPaymentRequest={
                  isCurrentUserSitter
                    ? () => {
                        setPlusMenuOpen(false);
                        setPaymentModalOpen(true);
                      }
                    : undefined
                }
                onSendCareRecord={
                  isCurrentUserSitter
                    ? () => {
                        setPlusMenuOpen(false);
                        setCareRecordOpen(true);
                      }
                    : undefined
                }
                onServiceStart={
                  isCurrentUserSitter ? handleServiceStart : undefined
                }
                onServiceComplete={
                  isCurrentUserSitter ? handleServiceComplete : undefined
                }
                onSendPhoto={() => photoInputRef.current?.click()}
              />
            )}

            {/* 입력창 */}
            {isRejectedApplicant ? (
              <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-400 shrink-0">
                지원이 거절되어 메시지를 보낼 수 없습니다.
              </div>
            ) : (
              <>
                {sendError && (
                  <p className="px-4 py-1 text-xs text-red-500 bg-red-50 border-t border-red-100 shrink-0">
                    {sendError}
                  </p>
                )}
                <div className="px-4 py-3 bg-white border-t border-orange-100 flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setPlusMenuOpen((v) => !v)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0"
                  >
                    <Plus
                      size={22}
                      className={`text-gray-500 transition-transform duration-200 ${plusMenuOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing)
                        handleSend();
                    }}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 h-11 px-4 bg-orange-50 rounded-2xl text-sm text-stone-900 placeholder-stone-900/50 outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 데스크톱 레이아웃 (md 이상) ── */}
      <div className="hidden md:flex flex-1 bg-orange-50 overflow-hidden">
        {/* 사이드바 */}
        <div className="w-96 bg-white border-r border-orange-100 flex flex-col shrink-0">
          {/* 헤더 */}
          <div className="px-6 pt-6 border-b border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-900 text-2xl font-bold">채팅</h2>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`text-sm font-medium transition-colors ${editMode ? "text-stone-900" : "text-orange-500"}`}
              >
                {editMode ? "완료" : "편집"}
              </button>
            </div>

            {/* 탭 */}
            <div className="flex">
              {(["one_on_one", "reservations", "applicants"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setEditMode(false);
                    }}
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-orange-500 text-orange-500"
                        : "border-transparent text-gray-400"
                    }`}
                  >
                    {tab === "one_on_one"
                      ? "1:1 채팅"
                      : tab === "reservations"
                        ? "예약 목록"
                        : "지원 목록"}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* 검색창 */}
          <div className="px-6 py-3 border-b border-orange-100">
            <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="채팅방 검색"
                className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-900/50 outline-none"
              />
            </div>
          </div>

          {/* 1:1 채팅 목록 */}
          {activeTab === "one_on_one" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {filteredRooms.map((room) => (
                <ChatRoomItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  editMode={editMode}
                  onDelete={handleDeleteRoom}
                  onClick={setSelectedRoomId}
                />
              ))}
            </ScrollArea>
          )}

          {/* 예약 목록 */}
          {activeTab === "reservations" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {filteredReservationRequests.length === 0 && (
                <p className="text-center text-stone-400 text-sm pt-16">
                  예약 요청이 없습니다
                </p>
              )}
              {filteredReservationRequests.map((rr) => (
                <ReservationRequestCard
                  key={rr.id}
                  reservationRequest={rr}
                  isSelected={selectedReservationRequestId === rr.id}
                  editMode={editMode}
                  isSitter={rr.ownerId !== userId}
                  actioningId={actioningId}
                  onSelect={setSelectedReservationRequestId}
                  onReject={handleRejectReservation}
                  onAccept={handleAcceptReservation}
                  onDelete={handleDeleteReservationRequest}
                />
              ))}
            </ScrollArea>
          )}

          {/* 지원 목록 */}
          {activeTab === "applicants" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {filteredPosts.map((post) => (
                <ApplicantPostGroup
                  key={post.id}
                  post={post}
                  applicants={filteredApplicants.filter(
                    (a) => a.postId === post.id,
                  )}
                  isCollapsed={collapsedPosts.has(post.id)}
                  isOwner={
                    applicants.find((a) => a.postId === post.id)?.ownerId ===
                    userId
                  }
                  selectedApplicantId={selectedApplicantId}
                  rejectedIds={rejectedIds}
                  confirmedId={confirmedIds.get(post.id) ?? null}
                  editMode={editMode}
                  onToggle={() => togglePostCollapse(post.id)}
                  onDelete={handleDeleteApplicant}
                  onReject={handleRejectApplicant}
                  onConfirm={handleConfirmClick}
                  onSelect={setSelectedApplicantId}
                  onAvatarClick={openApplicantProfile}
                  getApplicantBadge={getApplicantBadge}
                />
              ))}
            </ScrollArea>
          )}
        </div>

        {/* 채팅창 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-stone-400 text-sm">불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-stone-400 text-sm">{error}</p>
            </div>
          ) : (activeTab === "one_on_one" && rooms.length === 0) ||
            (activeTab === "applicants" && applicants.length === 0) ||
            (activeTab === "reservations" &&
              reservationRequests.length === 0) ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-stone-400 text-sm">
                새로운 채팅이 존재하지 않습니다
              </p>
            </div>
          ) : (activeTab === "one_on_one" && selectedRoomId === null) ||
            (activeTab === "applicants" && selectedApplicantId === null) ||
            (activeTab === "reservations" &&
              selectedReservationRequestId === null) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-base mb-2 text-stone-500">
                  채팅방을 선택해주세요
                </p>
                <p className="text-sm text-stone-400">
                  왼쪽 목록에서 대화를 시작할 상대를 선택하세요
                </p>
              </div>
            </div>
          ) : (
            <>
              <ChatWindowHeader
                initial={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.initial ?? "")
                    : activeTab === "reservations"
                      ? (selectedReservationRequest?.initial ?? "")
                      : (selectedApplicant?.initial ?? "")
                }
                src={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.profileImage ?? null)
                    : activeTab === "reservations"
                      ? (selectedReservationRequest?.profileImage ?? null)
                      : (selectedApplicant?.profileImage ?? null)
                }
                name={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.name ?? "")
                    : activeTab === "reservations"
                      ? (selectedReservationRequest?.name ?? "")
                      : (selectedApplicant?.name ?? "")
                }
                sub={getHeaderSub()}
                badge={getHeaderBadge()}
                onGoToProfile={() => {
                  const sitterId =
                    activeTab === "one_on_one"
                      ? selectedRoom?.sitterId
                      : activeTab === "reservations"
                        ? selectedReservationRequest?.sitterId
                        : selectedApplicant?.sitterId;
                  if (sitterId) router.push(`/petsitters/${sitterId}`);
                }}
                onLeaveChat={() => {
                  if (activeTab === "one_on_one" && selectedRoomId !== null)
                    handleDeleteRoom(selectedRoomId);
                  else if (
                    activeTab === "reservations" &&
                    selectedReservationRequestId !== null
                  )
                    handleDeleteReservationRequest(
                      selectedReservationRequestId,
                    );
                  else if (
                    activeTab === "applicants" &&
                    selectedApplicantId !== null
                  )
                    handleDeleteApplicant(selectedApplicantId);
                }}
                onReport={() => router.push(getReportUrl())}
              />

              <ScrollArea className="flex-1 min-h-0">
                <div
                  className="px-8 py-6 flex flex-col gap-6"
                  onClick={() => {
                    if (plusMenuOpen) setPlusMenuOpen(false);
                  }}
                >
                  {hasMore && (
                    <div className="flex justify-center py-2">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-sm text-orange-500 disabled:text-stone-400"
                      >
                        {loadingMore ? "불러오는 중..." : "이전 메시지 더 보기"}
                      </button>
                    </div>
                  )}
                  {withDateSeparators(displayMessages).map((msg) => {
                    const postId =
                      msg.applicationData?.postId ||
                      msg.paymentData?.postId ||
                      selectedApplicant?.postId;
                    // 메시지별 결제 완료 여부: 마지막 요청이면 파생 상태, 이전 요청이면 항상 true(비활성)
                    const isThisPaymentPaid =
                      msg.from === "payment_request"
                        ? msg.id === lastPaymentReqId
                          ? (paymentState?.paid ?? false)
                          : true
                        : false;
                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        senderInitial={
                          activeTab === "one_on_one"
                            ? (selectedRoom?.initial ?? "")
                            : activeTab === "reservations"
                              ? (selectedReservationRequest?.initial ?? "")
                              : (selectedApplicant?.initial ?? "")
                        }
                        senderProfileImage={
                          activeTab === "one_on_one"
                            ? (selectedRoom?.profileImage ?? null)
                            : activeTab === "reservations"
                              ? (selectedReservationRequest?.profileImage ??
                                null)
                              : (selectedApplicant?.profileImage ?? null)
                        }
                        isCurrentUserSitter={isCurrentUserSitter}
                        onPaymentRequest={handlePayNow}
                        isPaymentPending={payingNow || isPaymentPending}
                        isPaymentPaid={isThisPaymentPaid}
                        onPostClick={
                          postId
                            ? () => router.push(`/board/${postId}`)
                            : undefined
                        }
                        onGoToChat={() => {
                          const room = rooms.find(
                            (r) =>
                              r.ownerId === selectedApplicant?.ownerId &&
                              r.sitterId === selectedApplicant?.sitterId,
                          );
                          setActiveTab("one_on_one");
                          setSelectedApplicantId(null);
                          if (room) setSelectedRoomId(room.id);
                        }}
                        onServiceConfirm={(id) =>
                          setPendingServiceConfirmId(id)
                        }
                        isServiceConfirmed={
                          !!msg.serviceCompleteData?.reservationId &&
                          confirmedServiceIds.has(
                            msg.serviceCompleteData.reservationId,
                          )
                        }
                        isServiceConfirming={isServiceConfirming}
                      />
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {plusMenuOpen && (
                <ChatPlusPanel
                  onPaymentRequest={
                    isCurrentUserSitter
                      ? () => {
                          setPlusMenuOpen(false);
                          setPaymentModalOpen(true);
                        }
                      : undefined
                  }
                  onSendCareRecord={
                    isCurrentUserSitter
                      ? () => {
                          setPlusMenuOpen(false);
                          setCareRecordOpen(true);
                        }
                      : undefined
                  }
                  onServiceStart={
                    isCurrentUserSitter ? handleServiceStart : undefined
                  }
                  onServiceComplete={
                    isCurrentUserSitter ? handleServiceComplete : undefined
                  }
                  onSendPhoto={() => photoInputRef.current?.click()}
                />
              )}
              {applicationActionError && (
                <p className="px-8 py-1 text-xs text-red-500 bg-red-50 border-t border-red-100 shrink-0">
                  {applicationActionError}
                </p>
              )}
              {isRejectedApplicant ? (
                <div className="px-8 py-4 bg-stone-50 border-t border-stone-200 text-center text-sm text-stone-400 shrink-0">
                  지원이 거절되어 메시지를 보낼 수 없습니다.
                </div>
              ) : (
                <>
                  {sendError && (
                    <p className="px-8 py-1 text-xs text-red-500 bg-red-50 border-t border-red-100 shrink-0">
                      {sendError}
                    </p>
                  )}
                  <ChatInput
                    input={input}
                    onChange={setInput}
                    onSend={handleSend}
                    showPlusButton={true}
                    plusOpen={plusMenuOpen}
                    onPlusToggle={() => setPlusMenuOpen((v) => !v)}
                    disabled={sending}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
        disabled={sendingPhoto}
      />

      {profilePopupApplicant && (
        <ApplicantProfilePopup
          applicant={profilePopupApplicant}
          onClose={() => setProfilePopupApplicant(null)}
          cardVariant={
            profilePopupApplicant.ownerId === userId ? "sitter" : "owner"
          }
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
    </div>
  );
}

function ChatPageInner() {
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

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-orange-50">
          <p className="text-stone-400 text-sm">불러오는 중...</p>
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
