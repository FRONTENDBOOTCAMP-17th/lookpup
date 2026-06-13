"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronDown,
  MoreVertical,
  Send,
  Plus,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatRoomItem,
  ApplicantCard,
  ChatWindowHeader,
  MessageBubble,
  ChatInput,
  ChatPlusPanel,
  ApplicantProfilePopup,
  type ChatRoom,
  type Applicant,
  type Message,
} from "@/components/common/chat/chat_components";
import { CustomModalPayment } from "@/components/common/CustomModalPayment";
import CareRecordModal from "@/components/common/chat/CareRecordModal";

// 더미데이터
const Chat_One_On_One: ChatRoom[] = [
  {
    id: 1,
    name: "김민지",
    initial: "김",
    sub: "예약 진행중 · 6월 11일 오전 9시",
    lastMessage: "네, 그 시간에 가능합니다!",
    time: "오후 2:30",
    unread: 2,
  },
  {
    id: 2,
    name: "이서연",
    initial: "이",
    sub: "1:1 채팅",
    lastMessage: "사진 감사합니다",
    time: "오전 11:15",
    unread: 0,
  },
  {
    id: 3,
    name: "박준호",
    initial: "박",
    sub: "1:1 채팅",
    lastMessage: "알겠습니다",
    time: "어제",
    unread: 0,
  },
  {
    id: 4,
    name: "최예진",
    initial: "최",
    sub: "1:1 채팅",
    lastMessage: "예약 완료했습니다",
    time: "6월 10일",
    unread: 1,
  },
];

const DUMMY_POSTS = [
  {
    id: "post-1",
    title: "포메라니안 쿠키 산책 도우미 구합니다",
    status: "모집중",
  },
  {
    id: "post-2",
    title: "말티즈 몽이 주말 방문 돌봄 부탁드려요",
    status: "모집중",
  },
];

const Chat_Applicants: Applicant[] = [
  {
    id: 0,
    postId: "post-1",
    name: "김시터",
    initial: "김",
    rating: 4.8,
    preview: "잘 부탁드립니다! 강아지 산책...",
    unread: 2,
    location: "서울 마포구",
    reviewCount: 47,
    services: ["방문돌봄", "위탁돌봄", "산책"],
    experience: "5년",
    completedJobs: "230건",
    responseRate: "98%",
  },
  {
    id: 1,
    postId: "post-1",
    name: "이시터",
    initial: "이",
    rating: 4.5,
    preview: "언제든지 연락 주세요~",
    unread: 0,
    location: "서울 강남구",
    reviewCount: 23,
    services: ["방문돌봄", "산책"],
    experience: "3년",
    completedJobs: "95건",
    responseRate: "95%",
  },
  {
    id: 2,
    postId: "post-2",
    name: "박시터",
    initial: "박",
    rating: 4.9,
    preview: "경력 5년입니다 :)",
    unread: 0,
    location: "서울 송파구",
    reviewCount: 61,
    services: ["방문돌봄", "위탁돌봄"],
    experience: "7년",
    completedJobs: "310건",
    responseRate: "99%",
  },
  {
    id: 3,
    postId: "post-2",
    name: "최시터",
    initial: "최",
    rating: 4.7,
    preview: "자격증 보유하고 있어요",
    unread: 1,
    location: "서울 관악구",
    reviewCount: 38,
    services: ["산책", "위탁돌봄"],
    experience: "4년",
    completedJobs: "150건",
    responseRate: "96%",
  },
];

const Messages_one_on_one: Message[] = [
  {
    id: 1,
    from: "other",
    text: "안녕하세요! 6월 15일에 방문돌봄 예약 가능할까요?",
    time: "오후 2:15",
  },
  {
    id: 2,
    from: "me",
    text: "네, 안녕하세요! 그날 오전 시간대는 어떠세요?",
    time: "오후 2:18",
  },
  {
    id: 3,
    from: "other",
    text: "좋습니다! 오전 10시쯤 가능하신가요?",
    time: "오후 2:20",
  },
  { id: 4, from: "divider", text: "2024년 6월 14일" },
  { id: 5, from: "me", text: "네, 그 시간에 가능합니다!", time: "오후 2:30" },
  {
    id: 6,
    from: "other",
    text: "감사합니다. 그럼 예약 진행하겠습니다",
    time: "오후 2:32",
  },
];

const Messages_Applicants: Record<number, Message[]> = {
  0: [
    {
      id: 1,
      from: "other",
      text: "안녕하세요! 구인글 보고 지원했습니다 😊",
      time: "오후 2:10",
    },
    {
      id: 2,
      from: "me",
      text: "네 안녕하세요! 매일 오전 가능하신가요?",
      time: "오후 2:13",
    },
    {
      id: 3,
      from: "other",
      text: "네, 평일 오전 9시~11시 가능합니다!",
      time: "오후 2:16",
    },
  ],
  1: [
    {
      id: 1,
      from: "other",
      text: "안녕하세요! 지원합니다.",
      time: "오전 10:00",
    },
    { id: 2, from: "me", text: "경력이 어떻게 되세요?", time: "오전 10:05" },
  ],
  2: [
    {
      id: 1,
      from: "other",
      text: "경력 5년입니다. 잘 부탁드려요!",
      time: "오전 9:00",
    },
  ],
  3: [
    {
      id: 1,
      from: "other",
      text: "자격증 보유하고 있습니다!",
      time: "오후 1:00",
    },
  ],
};

export default function ChatPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [rooms, setRooms] = useState(Chat_One_On_One);
  const [applicants, setApplicants] = useState(Chat_Applicants);

  const [activeTab, setActiveTab] = useState<"one_on_one" | "applicants">(
    "one_on_one",
  );
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(
    null,
  );

  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());
  const [confirmedId, setConfirmedId] = useState<number | null>(null);
  const [sysMessages, setSysMessages] = useState<Record<number, string>>({});

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

  function openApplicantProfile(id: number) {
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

  function deleteRoom(id: number) {
    const next = rooms.filter((r) => r.id !== id);
    setRooms(next);
    if (selectedRoomId === id) setSelectedRoomId(next[0]?.id ?? null);
  }

  function deleteApplicant(id: number) {
    const next = applicants.filter((a) => a.id !== id);
    setApplicants(next);
    if (selectedApplicantId === id) setSelectedApplicantId(next[0]?.id ?? null);
  }

  function rejectApplicant(id: number) {
    if (confirmedId === id || rejectedIds.has(id)) return;
    setRejectedIds((prev) => new Set(prev).add(id));
    setSysMessages((prev) => ({
      ...prev,
      [id]: `${Chat_Applicants[id].name}님을 거절했습니다`,
    }));
  }

  function confirmApplicant(id: number) {
    if (rejectedIds.has(id) || confirmedId !== null) return;
    setConfirmedId(id);

    const newRejected = new Set(rejectedIds);
    const newMessages: Record<number, string> = { ...sysMessages };
    Chat_Applicants.forEach((a) => {
      if (a.id !== id) {
        newRejected.add(a.id);
        newMessages[a.id] = `${a.name}님을 거절했습니다`;
      }
    });
    setRejectedIds(newRejected);
    newMessages[id] = `${Chat_Applicants[id].name}님을 선택 확정했습니다 🎉`;
    setSysMessages(newMessages);
  }

  function getApplicantBadge(id: number) {
    if (rejectedIds.has(id))
      return { label: "거절됨", className: "bg-stone-100 text-stone-400" };
    if (confirmedId === id)
      return { label: "선택됨", className: "bg-orange-50 text-orange-500" };
    const unread = Chat_Applicants[id].unread;
    if (unread > 0)
      return {
        label: `새 메시지 ${unread}`,
        className: "bg-green-50 text-green-700",
      };
    return { label: "읽음", className: "bg-stone-100 text-stone-400" };
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
              {activeTab === "one_on_one" && rooms.length === 0 && (
                <p className="text-center text-stone-400 text-sm pt-16">
                  새로운 채팅이 존재하지 않습니다
                </p>
              )}
              {activeTab === "applicants" && applicants.length === 0 && (
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
                    onDelete={deleteRoom}
                    onClick={(id) => {
                      setSelectedRoomId(id);
                      setMobileChatView("room");
                    }}
                  />
                ))}

              {activeTab === "applicants" && (
                <>
                  {DUMMY_POSTS.map((post) => {
                    const group = applicants.filter(
                      (a) => a.postId === post.id,
                    );
                    if (group.length === 0) return null;
                    const isCollapsed = collapsedPosts.has(post.id);
                    return (
                      <div key={post.id}>
                        <button
                          onClick={() => togglePostCollapse(post.id)}
                          className="w-full px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between hover:bg-orange-100 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-stone-900 truncate max-w-55">
                              {post.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              지원자 {group.length}명 · {post.status}
                            </p>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                          />
                        </button>
                        {!isCollapsed &&
                          group.map((applicant) => (
                            <ApplicantCard
                              key={applicant.id}
                              applicant={applicant}
                              badge={getApplicantBadge(applicant.id)}
                              isRejected={rejectedIds.has(applicant.id)}
                              isConfirmed={confirmedId === applicant.id}
                              isSelected={false}
                              confirmedId={confirmedId}
                              editMode={editMode}
                              onDelete={deleteApplicant}
                              onReject={rejectApplicant}
                              onConfirm={confirmApplicant}
                              onSelect={(id) => {
                                setSelectedApplicantId(id);
                                setMobileChatView("room");
                              }}
                              onAvatarClick={openApplicantProfile}
                            />
                          ))}
                      </div>
                    );
                  })}
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
                            deleteRoom(selectedRoomId);
                          else if (
                            activeTab === "applicants" &&
                            selectedApplicantId !== null
                          )
                            deleteApplicant(selectedApplicantId);
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
            <ScrollArea className="flex-1">
              <div
                className="px-4 py-4 flex flex-col gap-4"
                onClick={() => {
                  if (plusMenuOpen) setPlusMenuOpen(false);
                }}
              >
                {(activeTab === "one_on_one"
                  ? Messages_one_on_one
                  : selectedApplicantId !== null
                    ? (Messages_Applicants[selectedApplicantId] ?? [])
                    : []
                ).map((msg) => (
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
              </div>
            </ScrollArea>

            {/* 지원자 거절/확정 버튼 */}
            {showApplicantActions && (
              <div className="px-4 py-2.5 bg-white border-t border-orange-100 flex gap-2 shrink-0">
                <button
                  onClick={() => rejectApplicant(selectedApplicantId!)}
                  className="flex-1 py-2 text-sm text-gray-500 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  거절
                </button>
                <button
                  onClick={() => confirmApplicant(selectedApplicantId!)}
                  className="flex-1 py-2 text-sm text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors font-medium"
                >
                  선택 확정
                </button>
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
              <button className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
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
                  onDelete={deleteRoom}
                  onClick={setSelectedRoomId}
                />
              ))}
            </ScrollArea>
          )}

          {/* 지원 목록 */}
          {activeTab === "applicants" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {DUMMY_POSTS.map((post) => {
                const group = applicants.filter((a) => a.postId === post.id);
                if (group.length === 0) return null;
                const isCollapsed = collapsedPosts.has(post.id);
                return (
                  <div key={post.id}>
                    <button
                      onClick={() => togglePostCollapse(post.id)}
                      className="w-full px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between hover:bg-orange-100 transition-colors shrink-0"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-stone-900 truncate max-w-50">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          지원자 {group.length}명 · {post.status}
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                      />
                    </button>
                    {!isCollapsed &&
                      group.map((applicant) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          badge={getApplicantBadge(applicant.id)}
                          isRejected={rejectedIds.has(applicant.id)}
                          isConfirmed={confirmedId === applicant.id}
                          isSelected={selectedApplicantId === applicant.id}
                          confirmedId={confirmedId}
                          editMode={editMode}
                          onDelete={deleteApplicant}
                          onReject={rejectApplicant}
                          onConfirm={confirmApplicant}
                          onSelect={setSelectedApplicantId}
                          onAvatarClick={openApplicantProfile}
                        />
                      ))}
                  </div>
                );
              })}
            </ScrollArea>
          )}
        </div>

        {/* 채팅창 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {(activeTab === "one_on_one" && rooms.length === 0) ||
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
                    deleteRoom(selectedRoomId);
                  else if (
                    activeTab === "applicants" &&
                    selectedApplicantId !== null
                  )
                    deleteApplicant(selectedApplicantId);
                }}
                onReport={() => router.push("/myprofile/report")}
              />

              <ScrollArea className="flex-1">
                <div
                  className="px-8 py-6 flex flex-col gap-6"
                  onClick={() => {
                    if (plusMenuOpen) setPlusMenuOpen(false);
                  }}
                >
                  {(activeTab === "one_on_one"
                    ? Messages_one_on_one
                    : (Messages_Applicants[selectedApplicantId!] ?? [])
                  ).map((msg) => (
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
              <ChatInput
                input={input}
                onChange={setInput}
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
