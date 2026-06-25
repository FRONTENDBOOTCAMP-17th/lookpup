"use client";

import { useState, useEffect, useLayoutEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
  ConfirmationCard,
  SitterConfirmationCard,
  OwnerRejectionCard,
  SitterRejectionCard,
  type Applicant,
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
} from "@/app/actions/chat";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { updateApplicationByRoom } from "@/app/actions/applications";
import { useChatRooms } from "@/hooks/chat/useChatRooms";
import { useRequest } from "@/hooks/chat/useRequest";
import { useChatMessages } from "@/hooks/chat/useChatMessages";

function ChatPageContent({
  initialTab,
  initialRoomId,
}: {
  initialTab: "one_on_one" | "applicants";
  initialRoomId?: string | null;
}) {
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"one_on_one" | "applicants">(
    initialTab,
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isLoadMoreRef = useRef(false);
  const scrollAnchorRef = useRef<number | null>(null);

  const [applicationActionError, setApplicationActionError] = useState<
    string | null
  >(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const activeRoomId =
    activeTab === "one_on_one" ? selectedRoomId : selectedApplicantId;

  const {
    rooms,
    applicants,
    posts,
    loading,
    error,
    deleteRoom,
    deleteApplicant,
    markRoomAsRead,
    updatePreview,
    updateApplicantStatus,
  } = useChatRooms(activeRoomId);

  const {
    rejectedIds,
    confirmedId,
    rejectApplicant,
    confirmApplicant,
    getApplicantBadge,
  } = useRequest(applicants);

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
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleConfirmApplicant(id: string) {
    if (actioningId) return;
    setActioningId(id);
    setApplicationActionError(null);
    try {
      const result = await updateApplicationByRoom(id, "selected");
      if (result.error) {
        setApplicationActionError(result.error.message);
        return;
      }
      confirmApplicant(id);
      updateApplicantStatus(id, "selected");
      broadcastConfirmation();
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  const {
    messages,
    addMessage,
    broadcastMessage,
    broadcastConfirmation,
    loadMore,
    hasMore,
    loadingMore,
  } = useChatMessages(activeRoomId, userId);

  useEffect(() => {
    if (!activeRoomId) return;
    markRoomAsRead(activeRoomId);
    markRoomRead(activeRoomId);
    setSendError(null);
  }, [activeRoomId, markRoomAsRead]);

  useLayoutEffect(() => {
    if (isLoadMoreRef.current) {
      isLoadMoreRef.current = false;
      const mobileEl = mobileScrollRef.current;
      if (scrollAnchorRef.current !== null && mobileEl) {
        mobileEl.scrollTop += mobileEl.scrollHeight - scrollAnchorRef.current;
        scrollAnchorRef.current = null;
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
    }
    isLoadMoreRef.current = true;
    loadMore();
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

  // 로그인 유저 ID 가져오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

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
    }
  }, [initialRoomId, rooms, loading]);

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
    if (selectedApplicantId !== null && rejectedIds.has(selectedApplicantId))
      return { label: "거절됨", className: "bg-stone-100 text-stone-500" };
    if (confirmedId === selectedApplicantId)
      return { label: "선택됨", className: "bg-green-50 text-green-700" };
    return { label: "채팅중", className: "bg-orange-50 text-orange-500" };
  }

  function getHeaderSub() {
    if (activeTab === "one_on_one") return selectedRoom?.sub ?? "";
    if (confirmedId === selectedApplicantId) return "구인글 채팅 · 선택됨";
    if (selectedApplicantId !== null && rejectedIds.has(selectedApplicantId))
      return "구인글 채팅 · 거절됨";
    return "구인글 채팅 · 지원자";
  }

  function getReportUrl() {
    const isOneOnOne = activeTab === "one_on_one";
    const isUserSitter = isOneOnOne && selectedRoom?.sitterId === userId;
    const targetName = isOneOnOne
      ? (selectedRoom?.name ?? "")
      : (selectedApplicant?.name ?? "");
    const targetId = isOneOnOne
      ? isUserSitter
        ? (selectedRoom?.ownerId ?? "")
        : (selectedRoom?.sitterId ?? "")
      : (selectedApplicant?.sitterId ?? "");

    const role = isUserSitter ? "보호자" : "펫시터";
    const service = getHeaderSub();
    const targetImage = isOneOnOne
      ? (selectedRoom?.profileImage ?? null)
      : (selectedApplicant?.profileImage ?? null);
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
      : (selectedApplicant?.name ?? "");
  const mobileRoomInitial =
    activeTab === "one_on_one"
      ? (selectedRoom?.initial ?? "")
      : (selectedApplicant?.initial ?? "");
  const mobileRoomProfileImage =
    activeTab === "one_on_one"
      ? (selectedRoom?.profileImage ?? null)
      : (selectedApplicant?.profileImage ?? null);
  const headerBadge = getHeaderBadge();

  const isCurrentUserSitter =
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
    confirmedId !== selectedApplicantId &&
    confirmedId === null;

  const isRejectedApplicant =
    activeTab === "applicants" &&
    !isOwnerOfSelectedRoom &&
    selectedApplicantId !== null &&
    rejectedIds.has(selectedApplicantId);

  const showConfirmationCard =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    confirmedId === selectedApplicantId &&
    isOwnerOfSelectedRoom;

  const showSitterConfirmationCard =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    selectedApplicant?.applicationStatus === "selected" &&
    !isOwnerOfSelectedRoom;

  const showOwnerRejectionCard =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    isOwnerOfSelectedRoom &&
    rejectedIds.has(selectedApplicantId);

  const showSitterRejectionCard =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    !isOwnerOfSelectedRoom &&
    rejectedIds.has(selectedApplicantId);

  const confirmedPostTitle = selectedApplicant
    ? (posts.find((p) => p.id === selectedApplicant.postId)?.title ?? "")
    : "";

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
                {(["one_on_one", "applicants"] as const).map((tab) => (
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
                    {tab === "one_on_one" ? "1:1 채팅" : "지원 목록"}
                  </button>
                ))}
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
                      confirmedId={confirmedId}
                      editMode={editMode}
                      onToggle={() => togglePostCollapse(post.id)}
                      onDelete={handleDeleteApplicant}
                      onReject={handleRejectApplicant}
                      onConfirm={handleConfirmApplicant}
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
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    senderInitial={mobileRoomInitial}
                    senderProfileImage={mobileRoomProfileImage}
                  />
                ))}
              </div>
            </div>

            {(showConfirmationCard ||
              showSitterConfirmationCard ||
              showOwnerRejectionCard ||
              showSitterRejectionCard) && (
              <div className="px-4 pt-2 pb-1 bg-orange-50 shrink-0">
                {showConfirmationCard && (
                  <ConfirmationCard
                    postTitle={confirmedPostTitle}
                    sitterInitial={selectedApplicant?.initial ?? ""}
                    sitterProfileImage={selectedApplicant?.profileImage}
                    onPostClick={() => {
                      if (selectedApplicant?.postId)
                        router.push(`/board/${selectedApplicant.postId}`);
                    }}
                    onBook={() => {
                      if (selectedApplicant?.sitterId)
                        router.push(
                          `/petsitters/${selectedApplicant.sitterId}/book`,
                        );
                    }}
                  />
                )}
                {showSitterConfirmationCard && (
                  <SitterConfirmationCard
                    postTitle={confirmedPostTitle}
                    ownerInitial={selectedApplicant?.initial ?? ""}
                    ownerProfileImage={selectedApplicant?.profileImage}
                    onPostClick={() => {
                      if (selectedApplicant?.postId)
                        router.push(`/board/${selectedApplicant.postId}`);
                    }}
                  />
                )}
                {showOwnerRejectionCard && <OwnerRejectionCard />}
                {showSitterRejectionCard && <SitterRejectionCard />}
              </div>
            )}

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
                    onClick={() => handleConfirmApplicant(selectedApplicantId!)}
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
              {(["one_on_one", "applicants"] as const).map((tab) => (
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
                  {tab === "one_on_one" ? "1:1 채팅" : "지원 목록"}
                </button>
              ))}
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
                  confirmedId={confirmedId}
                  editMode={editMode}
                  onToggle={() => togglePostCollapse(post.id)}
                  onDelete={handleDeleteApplicant}
                  onReject={handleRejectApplicant}
                  onConfirm={handleConfirmApplicant}
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
            (activeTab === "applicants" && applicants.length === 0) ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-stone-400 text-sm">
                새로운 채팅이 존재하지 않습니다
              </p>
            </div>
          ) : (activeTab === "one_on_one" && selectedRoomId === null) ||
            (activeTab === "applicants" && selectedApplicantId === null) ? (
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
                    : (selectedApplicant?.initial ?? "")
                }
                src={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.profileImage ?? null)
                    : (selectedApplicant?.profileImage ?? null)
                }
                name={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.name ?? "")
                    : (selectedApplicant?.name ?? "")
                }
                sub={getHeaderSub()}
                badge={getHeaderBadge()}
                onGoToProfile={() => {
                  const sitterId =
                    activeTab === "one_on_one"
                      ? selectedRoom?.sitterId
                      : selectedApplicant?.sitterId;
                  if (sitterId) router.push(`/petsitters/${sitterId}`);
                }}
                onLeaveChat={() => {
                  if (activeTab === "one_on_one" && selectedRoomId !== null)
                    handleDeleteRoom(selectedRoomId);
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
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      senderInitial={
                        activeTab === "one_on_one"
                          ? (selectedRoom?.initial ?? "")
                          : (selectedApplicant?.initial ?? "")
                      }
                      senderProfileImage={
                        activeTab === "one_on_one"
                          ? (selectedRoom?.profileImage ?? null)
                          : (selectedApplicant?.profileImage ?? null)
                      }
                    />
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {(showConfirmationCard ||
                showSitterConfirmationCard ||
                showOwnerRejectionCard ||
                showSitterRejectionCard) && (
                <div className="px-8 pt-3 pb-1 shrink-0">
                  {showConfirmationCard && (
                    <ConfirmationCard
                      postTitle={confirmedPostTitle}
                      sitterInitial={selectedApplicant?.initial ?? ""}
                      sitterProfileImage={selectedApplicant?.profileImage}
                      onPostClick={() => {
                        if (selectedApplicant?.postId)
                          router.push(`/board/${selectedApplicant.postId}`);
                      }}
                      onBook={() => {
                        if (selectedApplicant?.sitterId)
                          router.push(
                            `/petsitters/${selectedApplicant.sitterId}/book`,
                          );
                      }}
                    />
                  )}
                  {showSitterConfirmationCard && (
                    <SitterConfirmationCard
                      postTitle={confirmedPostTitle}
                      ownerInitial={selectedApplicant?.initial ?? ""}
                      ownerProfileImage={selectedApplicant?.profileImage}
                      onPostClick={() => {
                        if (selectedApplicant?.postId)
                          router.push(`/board/${selectedApplicant.postId}`);
                      }}
                    />
                  )}
                  {showOwnerRejectionCard && <OwnerRejectionCard />}
                  {showSitterRejectionCard && <SitterRejectionCard />}
                </div>
              )}

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
      />

      <CareRecordModal
        open={careRecordOpen}
        onClose={() => setCareRecordOpen(false)}
        serviceType="care"
        reservationId={selectedRoom?.reservationId ?? undefined}
        onSubmit={handleCareRecordSubmit}
      />
    </div>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "applicants" ? "applicants" : "one_on_one";
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
