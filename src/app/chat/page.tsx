"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  type Applicant,
} from "@/components/common/chat/chat_components";
import { CustomModalPayment } from "@/components/common/CustomModalPayment";
import CareRecordModal from "@/components/common/chat/CareRecordModal";
import { sendMessage } from "@/app/actions/chat";
import { updateApplicationByRoom } from "@/app/actions/applications";
import { useChatRooms } from "@/hooks/chat/useChatRooms";
import { useRequest } from "@/hooks/chat/useRequest";
import { useChatMessages } from "@/hooks/chat/useChatMessages";

export default function ChatPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"one_on_one" | "applicants">(
    "one_on_one",
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

  const [applicationActionError, setApplicationActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { rooms, applicants, posts, loading, error, deleteRoom, deleteApplicant } =
    useChatRooms();
  const {
    rejectedIds,
    confirmedId,
    sysMessages,
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
    } catch {
      setApplicationActionError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setActioningId(null);
    }
  }

  const activeRoomId =
    activeTab === "one_on_one" ? selectedRoomId : selectedApplicantId;

  const { messages, addMessage, loadMore, hasMore, loadingMore } = useChatMessages(activeRoomId, userId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      if (result.data) addMessage(result.data);
      setInput("");
    } finally {
      setSending(false);
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [careRecordOpen, setCareRecordOpen] = useState(false);

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

  function handleDeleteRoom(id: string) {
    deleteRoom(id);
    if (selectedRoomId === id) setSelectedRoomId(null);
  }

  function handleDeleteApplicant(id: string) {
    deleteApplicant(id);
    if (selectedApplicantId === id) setSelectedApplicantId(null);
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

  const mobileRoomName =
    activeTab === "one_on_one"
      ? (selectedRoom?.name ?? "")
      : (selectedApplicant?.name ?? "");
  const mobileRoomInitial =
    activeTab === "one_on_one"
      ? (selectedRoom?.initial ?? "")
      : (selectedApplicant?.initial ?? "");
  const headerBadge = getHeaderBadge();

  const showApplicantActions =
    activeTab === "applicants" &&
    selectedApplicantId !== null &&
    !rejectedIds.has(selectedApplicantId) &&
    confirmedId !== selectedApplicantId &&
    confirmedId === null;

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
                rooms.map((room) => (
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
                  {posts.map((post) => (
                    <ApplicantPostGroup
                      key={post.id}
                      post={post}
                      applicants={applicants.filter(
                        (a) => a.postId === post.id,
                      )}
                      isCollapsed={collapsedPosts.has(post.id)}
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
              <Avatar initial={mobileRoomInitial} size="sm" />
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
                          const id =
                            activeTab === "one_on_one"
                              ? selectedRoomId
                              : selectedApplicantId;
                          router.push(`/petsitters/${id}`);
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
                          setMobileChatView("list");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors border-t border-orange-50"
                      >
                        채팅 나가기
                      </button>
                      <button
                        onClick={() => {
                          router.push("/myprofile/report");
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
            <ScrollArea className="flex-1 min-h-0">
              <div
                className="px-4 py-4 flex flex-col gap-4"
                onClick={() => {
                  if (plusMenuOpen) setPlusMenuOpen(false);
                }}
              >
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={loadMore}
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
                  />
                ))}

                {activeTab === "applicants" &&
                  selectedApplicantId !== null &&
                  sysMessages[selectedApplicantId] && (
                    <div className="flex justify-center">
                      <span className="px-4 py-1 bg-white rounded-full text-gray-400 text-xs">
                        {sysMessages[selectedApplicantId]}
                      </span>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* 지원자 거절/확정 버튼 */}
            {showApplicantActions && (
              <div className="px-4 py-2.5 bg-white border-t border-orange-100 flex flex-col gap-1 shrink-0">
                {applicationActionError && (
                  <p className="text-xs text-red-500 px-1">{applicationActionError}</p>
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
                  activeTab === "one_on_one"
                    ? () => {
                        setPlusMenuOpen(false);
                        setPaymentModalOpen(true);
                      }
                    : undefined
                }
                onSendCareRecord={
                  activeTab === "one_on_one"
                    ? () => setPlusMenuOpen(false)
                    : undefined
                }
                onSendPhoto={() => setPlusMenuOpen(false)}
              />
            )}

            {/* 입력창 */}
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
                placeholder="채팅방 검색"
                className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-900/50 outline-none"
              />
            </div>
          </div>

          {/* 1:1 채팅 목록 */}
          {activeTab === "one_on_one" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {rooms.map((room) => (
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
              {posts.map((post) => (
                <ApplicantPostGroup
                  key={post.id}
                  post={post}
                  applicants={applicants.filter((a) => a.postId === post.id)}
                  isCollapsed={collapsedPosts.has(post.id)}
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
                name={
                  activeTab === "one_on_one"
                    ? (selectedRoom?.name ?? "")
                    : (selectedApplicant?.name ?? "")
                }
                sub={getHeaderSub()}
                badge={getHeaderBadge()}
                onGoToProfile={() => {
                  const id =
                    activeTab === "one_on_one"
                      ? selectedRoomId
                      : selectedApplicantId;
                  router.push(`/petsitters/${id}`);
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
                onReport={() => router.push("/myprofile/report")}
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
                        onClick={loadMore}
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
                    />
                  ))}

                  {activeTab === "applicants" &&
                    sysMessages[selectedApplicantId!] && (
                      <div className="flex justify-center">
                        <span className="px-4 py-1 bg-white rounded-full text-gray-400 text-xs">
                          {sysMessages[selectedApplicantId!]}
                        </span>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {plusMenuOpen && (
                <ChatPlusPanel
                  onPaymentRequest={
                    activeTab === "one_on_one"
                      ? () => {
                          setPlusMenuOpen(false);
                          setPaymentModalOpen(true);
                        }
                      : undefined
                  }
                  onSendCareRecord={
                    activeTab === "one_on_one"
                      ? () => {
                          setPlusMenuOpen(false);
                          setCareRecordOpen(true);
                        }
                      : undefined
                  }
                  onSendPhoto={() => setPlusMenuOpen(false)}
                />
              )}
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
        </div>
      </div>

      {profilePopupApplicant && (
        <ApplicantProfilePopup
          applicant={profilePopupApplicant}
          onClose={() => setProfilePopupApplicant(null)}
        />
      )}

      <CustomModalPayment
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />

      <CareRecordModal
        open={careRecordOpen}
        onClose={() => setCareRecordOpen(false)}
        serviceType="care"
      />
    </div>
  );
}
