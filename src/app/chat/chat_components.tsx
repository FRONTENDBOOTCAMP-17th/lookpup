import { useState } from "react";
import {
  Star,
  Trash2,
  Send,
  Plus,
  MoreVertical,
  MapPin,
  Check,
  X,
  CreditCard,
  ClipboardList,
  Camera,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

// 1:1 채팅의 각 목록
export type ChatRoom = {
  id: number;
  name: string;
  initial: string;
  sub: string;
  lastMessage: string;
  time: string;
  unread: number;
};

// 지원 목록의 각 목록
export type Applicant = {
  id: number;
  name: string;
  initial: string;
  rating: number;
  preview: string;
  unread: number;
  location?: string;
  reviewCount?: number;
  services?: string[];
  experience?: string;
  completedJobs?: string;
  responseRate?: string;
};

// 채팅창 메시지
export type Message = {
  id: number;
  from: string;
  text: string;
  time?: string;
};

// 우측 상단 상태 배지
export type Badge = {
  label: string;
  className: string;
};

// 편집 관련
type ChatRoomItemProps = {
  room: ChatRoom;
  isSelected: boolean;
  editMode: boolean;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
};

export function ChatRoomItem({
  room,
  isSelected,
  editMode,
  onDelete,
  onClick,
}: ChatRoomItemProps) {
  return (
    <div
      onClick={() => {
        if (!editMode) onClick(room.id);
      }}
      className={`flex items-start gap-4 p-5 border-b border-orange-100 transition-colors ${
        !editMode ? "cursor-pointer hover:bg-orange-50" : ""
      } ${isSelected && !editMode ? "bg-orange-50" : ""}`}
    >
      {editMode && (
        <button
          onClick={() => onDelete(room.id)}
          className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-4"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar initial={room.initial} size="lg" />
      </div>
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
  );
}

// 지원 목록 카드
type ApplicantCardProps = {
  applicant: Applicant;
  badge: Badge;
  isRejected: boolean;
  isConfirmed: boolean;
  isSelected: boolean;
  confirmedId: number | null;
  editMode: boolean;
  onDelete: (id: number) => void;
  onReject: (id: number) => void;
  onConfirm: (id: number) => void;
  onSelect: (id: number) => void;
  onAvatarClick?: (id: number) => void;
};

export function ApplicantCard({
  applicant,
  badge,
  isRejected,
  isConfirmed,
  isSelected,
  confirmedId,
  editMode,
  onDelete,
  onReject,
  onConfirm,
  onSelect,
  onAvatarClick,
}: ApplicantCardProps) {
  return (
    <div
      onClick={() => {
        if (!editMode) onSelect(applicant.id);
      }}
      className={`flex items-center border-b border-orange-100 transition-colors ${
        !editMode ? "cursor-pointer" : ""
      } ${isSelected && !editMode ? "bg-orange-50" : "hover:bg-stone-50"} ${isRejected ? "opacity-50" : ""}`}
    >
      {editMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(applicant.id);
          }}
          className="ml-5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      )}
      <div className="px-5 py-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={(e) => {
              if (!editMode && onAvatarClick) {
                e.stopPropagation();
                onAvatarClick(applicant.id);
              }
            }}
            className="shrink-0"
          >
            <Avatar initial={applicant.initial} size="sm" />
          </button>
          <span className="text-sm font-semibold text-stone-900 flex-1">
            {applicant.name}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex items-center justify-end mb-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            {applicant.rating}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate mb-3">
          "{applicant.preview}"
        </p>
        {isRejected ? (
          <p className="text-xs text-gray-400">거절한 지원자</p>
        ) : isConfirmed ? (
          <p className="text-xs text-orange-500 font-medium">
            선택 확정된 지원자
          </p>
        ) : !editMode ? (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(applicant.id);
              }}
              disabled={confirmedId !== null}
              className="flex-1 py-1.5 text-xs text-gray-500 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              거절
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(applicant.id);
              }}
              disabled={confirmedId !== null}
              className="flex-2 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-default transition-colors font-medium"
            >
              선택 확정
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// 채팅창 헤더
type ChatWindowHeaderProps = {
  initial: string;
  name: string;
  sub: string;
  badge: Badge;
  onGoToProfile?: () => void;
  onLeaveChat?: () => void;
  onReport?: () => void;
};

export function ChatWindowHeader({
  initial,
  name,
  sub,
  badge,
  onGoToProfile,
  onLeaveChat,
  onReport,
}: ChatWindowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-16 px-8 bg-white border-b border-orange-100 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Avatar initial={initial} />
        <div>
          <p className="text-stone-900 text-base font-semibold leading-5">
            {name}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${badge.className}`}
        >
          {badge.label}
        </span>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <MoreVertical size={20} className="text-gray-500" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-orange-100 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onGoToProfile?.();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors"
                >
                  프로필 보기
                </button>
                <button
                  onClick={() => {
                    onLeaveChat?.();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors border-t border-orange-50"
                >
                  채팅 나가기
                </button>
                <button
                  onClick={() => {
                    onReport?.();
                    setMenuOpen(false);
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
    </div>
  );
}

// 채팅 메시지 관련
type MessageBubbleProps = {
  msg: Message;
  senderInitial: string;
};

export function MessageBubble({ msg, senderInitial }: MessageBubbleProps) {
  if (msg.from === "divider") {
    return (
      <div className="flex justify-center">
        <span className="px-4 py-1 bg-white rounded-full text-gray-500 text-sm">
          {msg.text}
        </span>
      </div>
    );
  }
  if (msg.from === "other") {
    return (
      <div className="flex items-start gap-3">
        <Avatar initial={senderInitial} size="sm" />
        <div>
          <div className="max-w-xs px-5 py-4 bg-white rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
            <p className="text-stone-900 text-sm leading-6">{msg.text}</p>
          </div>
          <p className="text-gray-500 text-xs mt-1 pl-3">{msg.time}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-xs px-5 py-4 bg-orange-500 rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl">
        <p className="text-white text-sm leading-6">{msg.text}</p>
      </div>
      <p className="text-gray-500 text-xs pr-3">{msg.time}</p>
    </div>
  );
}

// 지원자 간략 프로필 팝업
type ApplicantProfilePopupProps = {
  applicant: Applicant;
  onClose: () => void;
};

export function ApplicantProfilePopup({
  applicant,
  onClose,
}: ApplicantProfilePopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-80 bg-white rounded-2xl overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 그라디언트 바 */}
        <div
          className="h-2 w-full"
          style={{
            background: "linear-gradient(90deg, #E8742A 0%, #F5A468 100%)",
          }}
        />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-orange-50 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>

        <div className="px-5 pt-4 pb-5">
          {/* 아바타 + 이름 */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative shrink-0">
              <Avatar initial={applicant.initial} size="lg" variant="orange" />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow">
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-stone-900 text-lg font-bold">
                  {applicant.name}
                </span>
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded-md">
                  인증
                </span>
              </div>
              {applicant.location && (
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-1.5">
                  <MapPin size={12} />
                  <span>{applicant.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-stone-900 text-sm font-bold">
                  {applicant.rating}
                </span>
                {applicant.reviewCount && (
                  <span className="text-gray-400 text-xs">
                    ({applicant.reviewCount}개 리뷰)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 서비스 태그 */}
          {applicant.services && applicant.services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {applicant.services.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
          )}

          {/* 통계 */}
          {(applicant.experience ||
            applicant.completedJobs ||
            applicant.responseRate) && (
            <div className="grid grid-cols-3 gap-2">
              {applicant.experience && (
                <div className="bg-orange-50 rounded-xl py-2.5 px-2 text-center">
                  <p className="text-orange-500 text-sm font-bold">
                    {applicant.experience}
                  </p>
                  <p className="text-gray-400 text-[11px] mt-1">경력</p>
                </div>
              )}
              {applicant.completedJobs && (
                <div className="bg-orange-50 rounded-xl py-2.5 px-2 text-center">
                  <p className="text-orange-500 text-sm font-bold">
                    {applicant.completedJobs}
                  </p>
                  <p className="text-gray-400 text-[11px] mt-1">완료 건수</p>
                </div>
              )}
              {applicant.responseRate && (
                <div className="bg-orange-50 rounded-xl py-2.5 px-2 text-center">
                  <p className="text-orange-500 text-sm font-bold">
                    {applicant.responseRate}
                  </p>
                  <p className="text-gray-400 text-[11px] mt-1">응답률</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// + 버튼 패널
type ChatPlusPanelProps = {
  onPaymentRequest?: () => void;
  onSendCareRecord?: () => void;
  onSendPhoto: () => void;
};

export function ChatPlusPanel({
  onPaymentRequest,
  onSendCareRecord,
  onSendPhoto,
}: ChatPlusPanelProps) {
  const actions = [
    onPaymentRequest
      ? { icon: CreditCard, label: "결제 요청", onClick: onPaymentRequest }
      : null,
    onSendCareRecord
      ? {
          icon: ClipboardList,
          label: "돌봄 기록 전송",
          onClick: onSendCareRecord,
        }
      : null,
    { icon: Camera, label: "사진 전송", onClick: onSendPhoto },
  ].filter(Boolean) as {
    icon: typeof CreditCard;
    label: string;
    onClick: () => void;
  }[];

  return (
    <div className="bg-white border-t border-orange-100 px-6 py-5 shrink-0">
      <div className="flex">
        {actions.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center hover:bg-orange-100 transition-colors">
              <Icon size={24} className="text-orange-500" />
            </div>
            <span className="text-xs text-gray-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// + 버튼
type ChatInputProps = {
  input: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  showPlusButton: boolean;
  plusOpen?: boolean;
  onPlusToggle?: () => void;
};

export function ChatInput({
  input,
  onChange,
  onSend,
  showPlusButton,
  plusOpen,
  onPlusToggle,
}: ChatInputProps) {
  return (
    <div className="p-6 bg-white border-t border-orange-100 shrink-0">
      <div className="flex items-center gap-3">
        {showPlusButton && (
          <button
            onClick={onPlusToggle}
            className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-colors"
          >
            <Plus
              size={24}
              className={`text-gray-500 transition-transform duration-200 ${plusOpen ? "rotate-45" : ""}`}
            />
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 h-14 px-5 py-4 bg-orange-50 rounded-2xl text-base text-stone-900 placeholder-stone-900/50 outline-none"
        />
        <button onClick={onSend} className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-colors">
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
