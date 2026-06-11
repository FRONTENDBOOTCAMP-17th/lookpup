"use client";

import { useState } from "react";
import { Search, Plus, Send, MoreVertical, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";

//더미더미 데이터
//일단 디비에 온라인 없어서 피그마에 있는 온라인은 빼둠
const CHAT_ROOMS = [
  {
    id: 1,
    name: "김민지",
    initial: "김",
    lastMessage: "네, 그 시간에 가능합니다!",
    time: "오후 2:30",
    unread: 2,
  },
  {
    id: 2,
    name: "이서연",
    initial: "이",
    lastMessage: "사진 감사합니다",
    time: "오전 11:15",
    unread: 0,
  },
  {
    id: 3,
    name: "박준호",
    initial: "박",
    lastMessage: "알겠습니다",
    time: "어제",
    unread: 0,
  },
  {
    id: 4,
    name: "최예진",
    initial: "최",
    lastMessage: "예약 완료했습니다",
    time: "6월 10일",
    unread: 1,
  },
];

const MESSAGES = [
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

export default function ChatPage() {
  const [editMode, setEditMode] = useState(false);
  const [rooms, setRooms] = useState(CHAT_ROOMS);
  const [selectedId, setSelectedId] = useState(1);
  const [input, setInput] = useState("");

  const selectedRoom = rooms.find((r) => r.id === selectedId) ?? rooms[0];

  function deleteRoom(id: number) {
    const next = rooms.filter((r) => r.id !== id);
    setRooms(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? -1);
  }

  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-64px)] bg-orange-50 overflow-hidden">
        {/* 사이드바 */}
        <div className="w-96 bg-white border-r border-orange-100 flex flex-col shrink-0">
          {/* 헤더 */}
          <div className="p-6 border-b border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-900 text-2xl font-bold">채팅</h2>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`text-sm font-medium transition-colors ${editMode ? "text-stone-900" : "text-orange-500"}`}
              >
                {editMode ? "완료" : "편집"}
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="채팅방 검색"
                className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-900/50 outline-none"
              />
            </div>
          </div>

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  if (!editMode) setSelectedId(room.id);
                }}
                className={`flex items-start gap-4 p-5 border-b border-orange-100 transition-colors ${
                  !editMode ? "cursor-pointer hover:bg-orange-50" : ""
                } ${selectedId === room.id && !editMode ? "bg-orange-50" : ""}`}
              >
                {/* 삭제 버튼 (편집 모드 -> 우선 삭제만 넣었는데 뭘 더 추가하면 좋을지 고민 필요) */}
                {editMode && (
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-4"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                )}

                {/* 아바타 */}
                <div className="relative shrink-0">
                  <Avatar initial={room.initial} size="lg" />
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-900 text-base font-semibold">
                      {room.name}
                    </span>
                    {room.unread > 0 && !editMode && (
                      <span className="w-6 h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {room.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm leading-5 py-1 truncate">
                    {room.lastMessage}
                  </p>
                  <span className="text-gray-500 text-xs">{room.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 영역 */}
        {selectedRoom ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 채팅 헤더 */}
            <div className="h-16 px-8 bg-white border-b border-orange-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <Avatar initial={selectedRoom.initial} />
                <p className="text-stone-900 text-lg font-semibold leading-7">
                  {selectedRoom.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full">
                  현재 예약
                </span>
                <button className="p-2 hover:bg-orange-50 rounded-lg transition-colors">
                  <MoreVertical size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 px-8 py-6 overflow-y-auto flex flex-col gap-6">
              {MESSAGES.map((msg) => {
                if (msg.from === "divider") {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="px-4 py-1 bg-white rounded-full text-gray-500 text-sm">
                        {msg.text}
                      </span>
                    </div>
                  );
                }
                if (msg.from === "other") {
                  return (
                    <div key={msg.id} className="flex items-start gap-3">
                      <Avatar initial={selectedRoom.initial} size="sm" />
                      <div>
                        <div className="max-w-xs px-5 py-4 bg-white rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
                          <p className="text-stone-900 text-sm leading-6">
                            {msg.text}
                          </p>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 pl-3">
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="flex flex-col items-end gap-1">
                    <div className="max-w-xs px-5 py-4 bg-orange-500 rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl">
                      <p className="text-white text-sm leading-6">{msg.text}</p>
                    </div>
                    <p className="text-gray-500 text-xs pr-3">{msg.time}</p>
                  </div>
                );
              })}
            </div>

            {/* 입력창 */}
            <div className="p-6 bg-white border-t border-orange-100 shrink-0">
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-colors">
                  <Plus size={24} className="text-gray-500" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 h-14 px-5 py-4 bg-orange-50 rounded-2xl text-base text-stone-900 placeholder-stone-900/50 outline-none"
                />
                <button className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-colors">
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-base">채팅방을 선택하세요</p>
          </div>
        )}
      </div>
    </>
  );
}
