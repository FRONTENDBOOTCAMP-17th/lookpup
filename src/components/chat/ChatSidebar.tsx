"use client";

import { memo, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatRoomItem,
  ApplicantPostGroup,
  ReservationRequestCard,
  type ChatRoom,
  type Applicant,
  type ReservationRequest,
  type Badge,
} from "@/components/common/chat/chat_components";
import type { Post } from "@/hooks/chat/useChatRooms";

interface ChatSidebarProps {
  className: string;
  isMobile?: boolean;
  activeTab: "one_on_one" | "reservations" | "applicants";
  searchQuery: string;
  loading: boolean;
  error: string | null;
  userId: string | null;
  filteredRooms: ChatRoom[];
  filteredApplicants: Applicant[];
  filteredPosts: Post[];
  filteredReservationRequests: ReservationRequest[];
  totalRoomCount: number;
  totalApplicantCount: number;
  totalReservationCount: number;
  applicants: Applicant[];
  selectedRoomId: string | null;
  selectedApplicantId: string | null;
  selectedReservationRequestId: string | null;
  rejectedIds: Set<string>;
  confirmedIds: Map<string, string>;
  actioningId: string | null;
  getApplicantBadge: (id: string) => Badge | null;
  onTabChange: (tab: "one_on_one" | "reservations" | "applicants") => void;
  onSearchChange: (q: string) => void;
  onRoomSelect: (id: string) => void;
  onApplicantSelect: (id: string) => void;
  onReservationSelect: (id: string) => void;
  onDeleteRoom: (id: string) => void;
  onDeleteApplicant: (id: string) => void;
  onDeleteReservationRequest: (id: string) => void;
  onRejectReservation: (id: string) => void;
  onAcceptReservation: (id: string) => void;
  onRejectApplicant: (id: string) => void;
  onConfirm: (id: string) => void;
  onAvatarClick: (id: string) => void;
  onReservationAvatarClick: (id: string) => void;
}

function ChatSidebarImpl({
  className,
  isMobile = false,
  activeTab,
  searchQuery,
  loading,
  error,
  userId,
  filteredRooms,
  filteredApplicants,
  filteredPosts,
  filteredReservationRequests,
  totalRoomCount,
  totalApplicantCount,
  totalReservationCount,
  applicants,
  selectedRoomId,
  selectedApplicantId,
  selectedReservationRequestId,
  rejectedIds,
  confirmedIds,
  actioningId,
  getApplicantBadge,
  onTabChange,
  onSearchChange,
  onRoomSelect,
  onApplicantSelect,
  onReservationSelect,
  onDeleteRoom,
  onDeleteApplicant,
  onDeleteReservationRequest,
  onRejectReservation,
  onAcceptReservation,
  onRejectApplicant,
  onConfirm,
  onAvatarClick,
  onReservationAvatarClick,
}: ChatSidebarProps) {
  const [editMode, setEditMode] = useState(false);
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());

  const px = isMobile ? "px-5" : "px-6";
  const pt = isMobile ? "pt-5" : "pt-6";
  const bgWhite = isMobile ? "bg-white " : "";
  const searchPy = isMobile ? "py-2.5" : "py-3";

  function togglePostCollapse(postId: string) {
    setCollapsedPosts((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  const tabBar = (["one_on_one", "reservations", "applicants"] as const).map(
    (tab) => (
      <button
        key={tab}
        onClick={() => {
          onTabChange(tab);
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
  );

  const filteredApplicantsByPostId = useMemo(() => {
    const map = new Map<string, Applicant[]>();
    for (const a of filteredApplicants) {
      const group = map.get(a.postId);
      if (group) group.push(a);
      else map.set(a.postId, [a]);
    }
    return map;
  }, [filteredApplicants]);

  const ownerIdByPostId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const a of applicants) {
      if (!map.has(a.postId)) map.set(a.postId, a.ownerId);
    }
    return map;
  }, [applicants]);

  const applicantList = (
    <>
      {filteredPosts.map((post) => (
        <ApplicantPostGroup
          key={post.id}
          post={post}
          applicants={filteredApplicantsByPostId.get(post.id) ?? []}
          isCollapsed={collapsedPosts.has(post.id)}
          isOwner={ownerIdByPostId.get(post.id) === userId}
          selectedApplicantId={selectedApplicantId}
          rejectedIds={rejectedIds}
          confirmedId={confirmedIds.get(post.id) ?? null}
          editMode={editMode}
          onToggle={() => togglePostCollapse(post.id)}
          onDelete={onDeleteApplicant}
          onReject={onRejectApplicant}
          onConfirm={onConfirm}
          onSelect={onApplicantSelect}
          onAvatarClick={onAvatarClick}
          getApplicantBadge={getApplicantBadge}
        />
      ))}
    </>
  );

  return (
    <div className={className}>
      {/* 헤더 */}
      <div
        className={`${px} ${pt} ${bgWhite}border-b border-orange-100 shrink-0`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-stone-900">채팅</h2>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`text-sm font-medium transition-colors ${
              editMode ? "text-stone-900" : "text-orange-500"
            }`}
          >
            {editMode ? "완료" : "편집"}
          </button>
        </div>
        <div className="flex">{tabBar}</div>
      </div>

      {/* 검색창 */}
      <div
        className={`${px} py-3 ${bgWhite}border-b border-orange-100 shrink-0`}
      >
        <div
          className={`flex items-center gap-2 px-4 ${searchPy} bg-orange-50 rounded-xl`}
        >
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="채팅방 검색"
            className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-900/50 outline-none"
          />
        </div>
      </div>

      {/* 목록 */}
      {isMobile ? (
        <ScrollArea className="flex-1 overflow-hidden">
          {loading && (
            <p className="text-center text-stone-400 text-sm pt-16">
              불러오는 중...
            </p>
          )}
          {!loading && error && (
            <p className="text-center text-stone-400 text-sm pt-16">{error}</p>
          )}
          {!loading &&
            !error &&
            activeTab === "one_on_one" &&
            (totalRoomCount === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                새로운 채팅이 존재하지 않습니다.
              </p>
            ) : filteredRooms.length === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                검색 결과가 없습니다.
              </p>
            ) : null)}
          {!loading &&
            !error &&
            activeTab === "applicants" &&
            (totalApplicantCount === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                새로운 채팅이 존재하지 않습니다.
              </p>
            ) : filteredApplicants.length === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                검색 결과가 없습니다.
              </p>
            ) : null)}
          {!loading &&
            !error &&
            activeTab === "reservations" &&
            (totalReservationCount === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                예약 요청이 없습니다.
              </p>
            ) : filteredReservationRequests.length === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-16">
                검색 결과가 없습니다.
              </p>
            ) : null)}
          {activeTab === "one_on_one" &&
            filteredRooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isSelected={false}
                editMode={editMode}
                onDelete={onDeleteRoom}
                onClick={onRoomSelect}
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
                onSelect={onReservationSelect}
                onReject={onRejectReservation}
                onAccept={onAcceptReservation}
                onDelete={onDeleteReservationRequest}
                onAvatarClick={onReservationAvatarClick}
              />
            ))}
          {activeTab === "applicants" && applicantList}
        </ScrollArea>
      ) : (
        <>
          {activeTab === "one_on_one" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {totalRoomCount === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  새로운 채팅이 존재하지 않습니다.
                </p>
              ) : filteredRooms.length === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filteredRooms.map((room) => (
                  <ChatRoomItem
                    key={room.id}
                    room={room}
                    isSelected={selectedRoomId === room.id}
                    editMode={editMode}
                    onDelete={onDeleteRoom}
                    onClick={onRoomSelect}
                  />
                ))
              )}
            </ScrollArea>
          )}
          {activeTab === "reservations" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {totalReservationCount === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  예약 요청이 없습니다.
                </p>
              ) : filteredReservationRequests.length === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filteredReservationRequests.map((rr) => (
                  <ReservationRequestCard
                    key={rr.id}
                    reservationRequest={rr}
                    isSelected={selectedReservationRequestId === rr.id}
                    editMode={editMode}
                    isSitter={rr.ownerId !== userId}
                    actioningId={actioningId}
                    onSelect={onReservationSelect}
                    onReject={onRejectReservation}
                    onAccept={onAcceptReservation}
                    onDelete={onDeleteReservationRequest}
                    onAvatarClick={onReservationAvatarClick}
                  />
                ))
              )}
            </ScrollArea>
          )}
          {activeTab === "applicants" && (
            <ScrollArea className="flex-1 overflow-hidden">
              {totalApplicantCount === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  새로운 채팅이 존재하지 않습니다.
                </p>
              ) : filteredApplicants.length === 0 ? (
                <p className="text-center text-stone-400 text-sm pt-16">
                  검색 결과가 없습니다.
                </p>
              ) : (
                applicantList
              )}
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
}

export const ChatSidebar = memo(ChatSidebarImpl);
