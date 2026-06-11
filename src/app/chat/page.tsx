"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Header from "@/components/layout/Header";
import {
  ChatRoomItem,
  ApplicantCard,
  ChatWindowHeader,
  MessageBubble,
  ChatInput,
  type ChatRoom,
  type Applicant,
  type Message,
} from "./chat_components";

// 컴포넌트 관련 : 본 페이지가 너무 길어서 분리할 수 있는 건 일단 분리해뒀어요
// 더미더미더미
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

const Chat_Applicants: Applicant[] = [
  {
    id: 0,
    name: "김시터",
    initial: "김",
    price: 35000,
    rating: 4.8,
    preview: "잘 부탁드립니다! 강아지 산책...",
    unread: 2,
  },
  {
    id: 1,
    name: "이시터",
    initial: "이",
    price: 30000,
    rating: 4.5,
    preview: "언제든지 연락 주세요~",
    unread: 0,
  },
  {
    id: 2,
    name: "박시터",
    initial: "박",
    price: 40000,
    rating: 4.9,
    preview: "경력 5년입니다 :)",
    unread: 0,
  },
  {
    id: 3,
    name: "최시터",
    initial: "최",
    price: 32000,
    rating: 4.7,
    preview: "자격증 보유하고 있어요",
    unread: 1,
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
  { id: 4, from: "divider", text: "2024년 6월 14일" }, // 날짜 구분선
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

// 컴포넌트
export default function ChatPage() {
  const [editMode, setEditMode] = useState(false);
  const [rooms, setRooms] = useState(Chat_One_On_One);
  const [applicants, setApplicants] = useState(Chat_Applicants);

  const [activeTab, setActiveTab] = useState<"one_on_one" | "applicants">(
    "one_on_one",
  );
  const [selectedRoomId, setSelectedRoomId] = useState(1);
  const [input, setInput] = useState("");

  const [selectedApplicantId, setSelectedApplicantId] = useState(0);

  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());
  const [confirmedId, setConfirmedId] = useState<number | null>(null);
  const [sysMessages, setSysMessages] = useState<Record<number, string>>({});

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];
  const selectedApplicant = applicants.find(
    (a) => a.id === selectedApplicantId,
  );

  function deleteRoom(id: number) {
    const next = rooms.filter((r) => r.id !== id);
    setRooms(next);
    if (selectedRoomId === id) setSelectedRoomId(next[0]?.id ?? -1);
  }

  function deleteApplicant(id: number) {
    const next = applicants.filter((a) => a.id !== id);
    setApplicants(next);
    if (selectedApplicantId === id) setSelectedApplicantId(next[0]?.id ?? -1);
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
    if (rejectedIds.has(selectedApplicantId))
      return { label: "거절됨", className: "bg-stone-100 text-stone-500" };
    if (confirmedId === selectedApplicantId)
      return { label: "선택됨", className: "bg-green-50 text-green-700" };
    return { label: "채팅중", className: "bg-orange-50 text-orange-500" };
  }

  function getHeaderSub() {
    if (activeTab === "one_on_one") return selectedRoom?.sub ?? "";
    if (confirmedId === selectedApplicantId) return "구인글 채팅 · 선택됨";
    if (rejectedIds.has(selectedApplicantId)) return "구인글 채팅 · 거절됨";
    return "구인글 채팅 · 지원자";
  }

  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-64px)] bg-orange-50 overflow-hidden">
        {/* 사이드바 */}
        <div className="w-96 bg-white border-r border-orange-100 flex flex-col shrink-0">
          {/* 헤더 */}
          <div className="px-6 pt-6 border-b border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-900 text-2xl font-bold">채팅</h2>
              {/* 편집 버튼 */}
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

          {/* 1:1 채팅*/}
          {activeTab === "one_on_one" && (
            <div className="flex-1 overflow-y-auto">
              {rooms.map((room) => (
                <ChatRoomItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id} // 선택된 방은 강조 표시
                  editMode={editMode}
                  onDelete={deleteRoom}
                  onClick={setSelectedRoomId}
                />
              ))}
            </div>
          )}

          {/* 지원 목록 */}
          {activeTab === "applicants" && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {applicants.length > 0 && (
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 shrink-0">
                  <p className="text-sm font-medium text-stone-900">
                    산책 도우미 구해요
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    지원자 {applicants.length}명 · 모집중
                  </p>
                </div>
              )}

              {applicants.map((applicant) => (
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
                />
              ))}
            </div>
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
          ) : (
            <>
              {/* 헤더 */}
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
              />

              {/* 메시지창 */}
              <div className="flex-1 px-8 py-6 overflow-y-auto flex flex-col gap-6">
                {(activeTab === "one_on_one"
                  ? Messages_one_on_one
                  : (Messages_Applicants[selectedApplicantId] ?? [])
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

                {/* 거절/선택 확정 시 안내 메시지 */}
                {activeTab === "applicants" &&
                  sysMessages[selectedApplicantId] && (
                    <div className="flex justify-center">
                      <span className="px-4 py-1 bg-white rounded-full text-gray-400 text-xs">
                        {sysMessages[selectedApplicantId]}
                      </span>
                    </div>
                  )}
              </div>

              {/* 입력창 부분 */}
              <ChatInput
                input={input}
                onChange={setInput}
                showPlusButton={activeTab === "one_on_one"}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
