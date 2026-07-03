import { useState, useEffect, memo } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Star,
  Trash2,
  Send,
  Plus,
  MoreVertical,
  X,
  XCircle,
  CreditCard,
  ClipboardList,
  Camera,
  ChevronDown,
  CheckCircle,
  PlayCircle,
  CalendarRange,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import SitterProfileCard, {
  type SitterProfile,
} from "@/components/sitter/SitterProfileCard";

// 1:1 채팅의 각 목록
export type ChatRoom = {
  id: string;
  ownerId: string | null;
  sitterId: string | null;
  reservationId: string | null;
  reservationStatus: string | null;
  name: string;
  initial: string;
  profileImage?: string | null;
  sub: string;
  lastMessage: string;
  time: string;
  unread: number;
};

// 지원 목록의 각 목록
export type Applicant = {
  id: string;
  sitterId: string | null;
  ownerId: string | null;
  postId: string;
  name: string;
  initial: string;
  profileImage?: string | null;
  rating: number;
  preview: string;
  time: string;
  unread: number;
  applicationStatus?: string | null;
  location?: string;
  reviewCount?: number;
  services?: string[];
  experience?: string;
  completedJobs?: string;
};

export type ReservationRequest = {
  id: string;
  sitterId: string | null;
  ownerId: string | null;
  reservationId: string | null;
  name: string;
  initial: string;
  profileImage?: string | null;
  rating: number;
  sub: string;
  preview: string;
  time: string;
  unread: number;
  reservationStatus: string | null;
};

// 채팅방 나가기 제한
const ACTIVE_RESERVATION_STATUSES = new Set([
  "pending",
  "accepted",
  "paid",
  "in_progress",
]);

export function canLeaveDirectRoom(
  room: Pick<ChatRoom, "reservationId" | "reservationStatus">,
): boolean {
  if (!room.reservationId) return true;
  if (!room.reservationStatus) return false;
  return !ACTIVE_RESERVATION_STATUSES.has(room.reservationStatus);
}

export function canLeaveReservationRequest(
  rr: Pick<ReservationRequest, "reservationStatus">,
): boolean {
  return rr.reservationStatus !== "pending";
}

export type CostItem = {
  id: string;
  name: string;
  amount: string;
  description: string;
};

export type PaymentData = {
  amount: number;
  reason: string;
  deadline: string;
  postId?: string;
  sentByMe?: boolean;
  isExtra?: boolean;
  costItems?: CostItem[];
};

export type ApplicationData = {
  postTitle: string;
  postId: string;
  sitterId: string;
  sentByMe?: boolean;
};

export type ServiceCompleteData = {
  reservationId: string;
  serviceTitle?: string;
  petName?: string;
  startDatetime?: string;
  endDatetime?: string;
  totalPrice?: number;
};

export type ReservationRequestData = {
  reservationId: string;
  serviceTitle: string;
  startDatetime: string;
  endDatetime: string;
  totalPrice: number;
  petNames: string[];
  sentByMe?: boolean;
};

export type ReservationAcceptedData = {
  reservationId: string;
  totalPrice: number;
  startDatetime?: string;
  endDatetime?: string;
  sentByMe?: boolean;
};

export type ReservationEditPayload = {
  reservationId: string;
  original: {
    start_datetime: string;
    end_datetime: string;
    memo?: string | null;
  };
  proposed: {
    start_datetime: string;
    end_datetime: string;
    memo?: string | null;
  };
  sentByMe?: boolean;
};

export type ReservationEditResponsePayload = {
  originalMessageId: string;
  accepted: boolean;
  sentByMe?: boolean;
};

export type ReservationEditActionState = {
  messageId: string;
  type: "confirm" | "reject";
} | null;

// 채팅창 메시지
export type Message = {
  id: string;
  from:
    | "me"
    | "other"
    | "divider"
    | "date_separator"
    | "payment_request"
    | "payment_complete"
    | "application_selected"
    | "application_rejected"
    | "reservation_canceled"
    | "service_complete"
    | "service_complete_confirmed"
    | "reservation_request"
    | "reservation_accepted"
    | "reservation_rejected"
    | "service_start"
    | "reservation_edit"
    | "reservation_edit_response";
  text: string;
  imageUrl?: string;
  time?: string;
  rawDate?: string;
  paymentData?: PaymentData;
  paymentRequestMessageId?: string;
  applicationData?: ApplicationData;
  serviceCompleteData?: ServiceCompleteData;
  serviceCompleteConfirmedData?: ServiceCompleteData;
  serviceStartData?: ServiceCompleteData;
  reservationRequestData?: ReservationRequestData;
  reservationAcceptedData?: ReservationAcceptedData;
  reservationEditData?: ReservationEditPayload;
  reservationEditResponseData?: ReservationEditResponsePayload;
  sentByMe?: boolean;
};

// 우측 상단 상태 배지
export type Badge = {
  label: string;
  className: string;
};

// 새 메시지 알림 뱃지 (1:1 채팅 / 지원 목록 / 예약 목록 공통)
function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="w-6 h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
      {count}
    </span>
  );
}

// 별점 표시 (지원 목록 / 예약 목록 공통)
function RatingDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-sm text-gray-400">
      <Star size={12} className="text-yellow-400 fill-yellow-400" />
      {rating.toFixed(1)}
    </span>
  );
}

// 편집 관련
type ChatRoomItemProps = {
  room: ChatRoom;
  isSelected: boolean;
  editMode: boolean;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  priority?: boolean;
};

function ChatRoomItemImpl({
  room,
  isSelected,
  editMode,
  onDelete,
  onClick,
  priority = false,
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
      {editMode && canLeaveDirectRoom(room) && (
        <button
          onClick={() => onDelete(room.id)}
          className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-4"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar
          initial={room.initial}
          src={room.profileImage}
          size="lg"
          priority={priority}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-stone-900 text-base font-semibold">
            {room.name}
          </span>
          {!editMode && <UnreadBadge count={room.unread} />}
        </div>
        {room.sub && (
          <span className="inline-block max-w-full truncate text-xs font-medium px-2 py-0.5 my-1 rounded-full bg-orange-100 text-orange-600">
            {room.sub}
          </span>
        )}
        <p className="text-gray-500 text-sm leading-5 py-1 truncate">
          {room.lastMessage}
        </p>
        <span className="text-gray-500 text-xs">{room.time}</span>
      </div>
    </div>
  );
}

export const ChatRoomItem = memo(ChatRoomItemImpl);

// 지원 목록 카드
type ApplicantCardProps = {
  applicant: Applicant;
  badge: Badge | null;
  isRejected: boolean;
  isConfirmed: boolean;
  isSelected: boolean;
  isOwner: boolean;
  confirmedId: string | null;
  editMode: boolean;
  onDelete: (id: string) => void;
  onReject: (id: string) => void;
  onConfirm: (id: string) => void;
  onSelect: (id: string) => void;
  onAvatarClick?: (id: string) => void;
};

function ApplicantCardImpl({
  applicant,
  badge,
  isRejected,
  isConfirmed,
  isSelected,
  isOwner,
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
            <Avatar
              initial={applicant.initial}
              src={applicant.profileImage}
              size="md"
            />
          </button>
          <span className="text-base font-semibold text-stone-900 flex-1 truncate">
            {applicant.name}
          </span>
          {badge && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
          <UnreadBadge count={applicant.unread} />
        </div>
        <p className="text-sm text-gray-400 truncate mb-1.5">
          &ldquo;{applicant.preview}&rdquo;
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">{applicant.time}</span>
          <RatingDisplay rating={applicant.rating} />
        </div>
        {isRejected ? (
          <p className="text-xs text-gray-400">거절한 지원자</p>
        ) : isConfirmed ? (
          <p className="text-xs text-orange-500 font-medium">
            선택 확정된 지원자
          </p>
        ) : isOwner && !editMode ? (
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
              className="flex-1 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-default transition-colors font-medium"
            >
              선택 확정
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const ApplicantCard = memo(ApplicantCardImpl);

// 채팅창 헤더
type ChatWindowHeaderProps = {
  initial: string;
  src?: string | null;
  name: string;
  sub: string;
  badge: Badge;
  onGoToProfile?: () => void;
  onLeaveChat?: () => void;
  canLeaveChat?: boolean;
  onReport?: () => void;
};

function ChatWindowHeaderImpl({
  initial,
  src,
  name,
  sub,
  badge,
  onGoToProfile,
  onLeaveChat,
  canLeaveChat = true,
  onReport,
}: ChatWindowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-16 px-8 bg-white border-b border-orange-100 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Avatar initial={initial} src={src} />
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
                {canLeaveChat && (
                  <button
                    onClick={() => {
                      onLeaveChat?.();
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-orange-50 transition-colors border-t border-orange-50"
                  >
                    채팅 나가기
                  </button>
                )}
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

export const ChatWindowHeader = memo(ChatWindowHeaderImpl);

function ChatImageLightbox({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root
      open={url !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none cursor-pointer data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
          onClick={onClose}
        >
          <DialogPrimitive.Title className="sr-only">
            이미지 보기
          </DialogPrimitive.Title>
          <div
            className="absolute top-4 right-4"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogPrimitive.Close className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
              <X size={18} />
              <span className="sr-only">닫기</span>
            </DialogPrimitive.Close>
          </div>
          {url && (
            <div
              className="w-full max-w-4xl px-4 md:px-6 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={url}
                alt=""
                className="w-full object-contain max-h-[78vh] rounded-2xl"
              />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// 채팅 메시지 관련
type MessageBubbleProps = {
  msg: Message;
  senderInitial: string;
  senderProfileImage?: string | null;
  isCurrentUserSitter?: boolean;
  onPaymentRequest?: () => void;
  isPaymentPending?: boolean;
  isPaymentPaid?: boolean;
  onPostClick?: () => void;
  onGoToChat?: () => void;
  onServiceConfirm?: (reservationId: string) => void;
  isServiceConfirmed?: boolean;
  isServiceConfirming?: boolean;
  onReservationEditConfirm?: (
    messageId: string,
    reservationId: string,
    proposed: {
      start_datetime: string;
      end_datetime: string;
      memo?: string | null;
    },
  ) => void;
  onReservationEditReject?: (messageId: string) => void;
  confirmedEditIds?: Set<string>;
  reservationEditAction?: ReservationEditActionState;
  onWriteReview?: (reservationId: string) => void;
  onLeaveChat?: () => void;
};

function MessageBubbleImpl({
  msg,
  senderInitial,
  senderProfileImage,
  isCurrentUserSitter,
  onPaymentRequest,
  isPaymentPending,
  isPaymentPaid,
  onPostClick,
  onGoToChat,
  onServiceConfirm,
  isServiceConfirmed,
  isServiceConfirming,
  onReservationEditConfirm,
  onReservationEditReject,
  confirmedEditIds,
  reservationEditAction,
  onWriteReview,
  onLeaveChat,
}: MessageBubbleProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (msg.from === "reservation_edit_response") {
    const data = msg.reservationEditResponseData;
    if (!data) return null;
    return (
      <div
        className={`flex ${data.sentByMe ? "justify-end" : "items-start gap-3"}`}
      >
        {!data.sentByMe && (
          <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
        )}
        <div>
          {data.accepted ? (
            <ReservationEditAcceptedCard sentByMe={data.sentByMe ?? false} />
          ) : (
            <ReservationEditRejectedCard sentByMe={data.sentByMe ?? false} />
          )}
          {msg.time && (
            <p
              className={`text-gray-500 text-xs mt-1 ${data.sentByMe ? "text-right pr-3" : "text-left pl-3"}`}
            >
              {msg.time}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (msg.from === "reservation_edit") {
    const data = msg.reservationEditData;
    if (!data) return null;
    const isProcessed = confirmedEditIds?.has(msg.id);
    return (
      <div
        className={`flex ${data.sentByMe ? "justify-end" : "items-start gap-3"}`}
      >
        {!data.sentByMe && (
          <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
        )}
        <div>
          <ReservationEditCard
            messageId={msg.id}
            data={data}
            isProcessed={isProcessed ?? false}
            reservationEditAction={reservationEditAction ?? null}
            onConfirm={onReservationEditConfirm}
            onReject={onReservationEditReject}
          />
          {msg.time && (
            <p
              className={`text-gray-500 text-xs mt-1 ${data.sentByMe ? "text-right pr-3" : "text-left pl-3"}`}
            >
              {msg.time}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (msg.from === "service_start") {
    if (isCurrentUserSitter && msg.sentByMe) {
      return (
        <div>
          <SitterServiceStartCard data={msg.serviceStartData} />
          {msg.time && (
            <p className="text-right text-gray-500 text-xs pr-3 mt-1">
              {msg.time}
            </p>
          )}
        </div>
      );
    }
    return (
      <div>
        <ServiceStartCard
          otherInitial={senderInitial}
          otherProfileImage={senderProfileImage}
          data={msg.serviceStartData}
        />
        {msg.time && (
          <p className="text-left text-gray-500 text-xs pl-11 mt-1">
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "reservation_request") {
    const data = msg.reservationRequestData;
    if (!data) return null;
    return (
      <div>
        <ReservationRequestMessageCard
          data={data}
          senderInitial={senderInitial}
          senderProfileImage={senderProfileImage}
        />
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${data.sentByMe ? "text-right pr-3" : "text-left pl-11"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "reservation_accepted") {
    const data = msg.reservationAcceptedData;
    if (!data) return null;
    return (
      <div>
        <ReservationAcceptedMessageCard
          data={data}
          senderInitial={senderInitial}
          senderProfileImage={senderProfileImage}
        />
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${data.sentByMe ? "text-right pr-3" : "text-left pl-11"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "reservation_rejected") {
    return (
      <div>
        <ReservationRejectedMessageCard sentByMe={msg.sentByMe ?? false} />
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${msg.sentByMe ? "text-right pr-3" : "text-left"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "application_selected") {
    const data = msg.applicationData;
    if (!data) return null;
    return (
      <div>
        {data.sentByMe ? (
          <ConfirmationCard
            postTitle={data.postTitle}
            sitterInitial={senderInitial}
            sitterProfileImage={senderProfileImage}
            onPostClick={onPostClick}
            onGoToChat={onGoToChat ?? (() => {})}
          />
        ) : (
          <SitterConfirmationCard
            postTitle={data.postTitle}
            ownerInitial={senderInitial}
            ownerProfileImage={senderProfileImage}
            onPostClick={onPostClick}
            onGoToChat={onGoToChat}
          />
        )}
        {msg.time && (
          <p className="text-right text-gray-500 text-xs pr-3 mt-1">
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "application_rejected") {
    return (
      <div>
        {msg.applicationData?.sentByMe ? (
          <OwnerRejectionCard />
        ) : (
          <SitterRejectionCard />
        )}
        {msg.time && (
          <p className="text-right text-gray-500 text-xs pr-3 mt-1">
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "reservation_canceled") {
    return (
      <div>
        <ReservationCanceledCard sentByMe={msg.sentByMe ?? false} />
        {msg.time && (
          <p className="text-right text-gray-500 text-xs pr-3 mt-1">
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "service_complete") {
    if (msg.sentByMe) {
      return (
        <div>
          <SitterServiceCompleteCard data={msg.serviceCompleteData} />
          {msg.time && (
            <p className="text-right text-gray-500 text-xs pr-3 mt-1">
              {msg.time}
            </p>
          )}
        </div>
      );
    }
    const reservationId = msg.serviceCompleteData?.reservationId ?? "";
    return (
      <div>
        <ServiceCompleteCard
          confirmed={isServiceConfirmed ?? false}
          onConfirm={() => onServiceConfirm?.(reservationId)}
          isConfirming={isServiceConfirming ?? false}
          otherInitial={senderInitial}
          otherProfileImage={senderProfileImage}
          data={msg.serviceCompleteData}
        />
        {msg.time && (
          <p className="text-left text-gray-500 text-xs pl-11 mt-1">
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "service_complete_confirmed") {
    const confirmedReservationId =
      msg.serviceCompleteConfirmedData?.reservationId ?? "";
    const sentByMe = msg.sentByMe ?? false;
    return (
      <div>
        <ServiceCompletedCard
          sentByMe={sentByMe}
          senderInitial={senderInitial}
          senderProfileImage={senderProfileImage}
          data={msg.serviceCompleteConfirmedData}
          canWriteReview={sentByMe}
          onWriteReview={() => onWriteReview?.(confirmedReservationId)}
          onLeaveChat={onLeaveChat}
        />
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${msg.sentByMe ? "text-right pr-3" : "text-left pl-11"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "payment_request") {
    const data = msg.paymentData;
    if (!data) return null;
    return (
      <div>
        {data.sentByMe ? (
          <SitterPaymentRequestCard
            amount={data.amount}
            reason={data.reason}
            otherInitial={senderInitial}
            otherProfileImage={senderProfileImage}
            onPostClick={onPostClick}
            costItems={data.costItems}
            isExtra={data.isExtra}
          />
        ) : (
          <PaymentRequestCard
            amount={data.amount}
            reason={data.reason}
            deadline={data.deadline}
            paid={isPaymentPaid ?? false}
            onPay={onPaymentRequest}
            isPaying={isPaymentPending ?? false}
            otherInitial={senderInitial}
            otherProfileImage={senderProfileImage}
            onPostClick={onPostClick}
            isExtra={data.isExtra}
            costItems={data.costItems}
          />
        )}
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${data.sentByMe ? "text-right pr-3" : "text-left pl-11"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "payment_complete") {
    const sentByMe = msg.paymentData?.sentByMe ?? msg.sentByMe ?? true;
    return (
      <div>
        <PaymentCompleteCard
          amount={msg.paymentData?.amount ?? 0}
          sentByMe={sentByMe}
          otherInitial={senderInitial}
          otherProfileImage={senderProfileImage}
        />
        {msg.time && (
          <p
            className={`text-gray-500 text-xs mt-1 ${sentByMe ? "text-right pr-3" : "text-left pl-11"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    );
  }
  if (msg.from === "date_separator") {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400 shrink-0">{msg.text}</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>
    );
  }
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
        <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
        <div>
          {msg.imageUrl ? (
            <>
              <button
                onClick={() => setLightboxUrl(msg.imageUrl!)}
                className="max-w-xs overflow-hidden rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm block focus:outline-none cursor-pointer"
              >
                <Image
                  src={msg.imageUrl}
                  alt="사진"
                  width={240}
                  height={240}
                  className="object-cover w-60 h-auto"
                />
              </button>
              <ChatImageLightbox
                url={lightboxUrl}
                onClose={() => setLightboxUrl(null)}
              />
            </>
          ) : (
            <div className="max-w-xs px-5 py-4 bg-white rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
              <p className="text-stone-900 text-sm leading-6">{msg.text}</p>
            </div>
          )}
          <p className="text-gray-500 text-xs mt-1 pl-3">{msg.time}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      {msg.imageUrl ? (
        <>
          <button
            onClick={() => setLightboxUrl(msg.imageUrl!)}
            className="max-w-xs overflow-hidden rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl block focus:outline-none cursor-pointer"
          >
            <Image
              src={msg.imageUrl}
              alt="사진"
              width={240}
              height={240}
              className="object-cover w-60 h-auto"
            />
          </button>
          <ChatImageLightbox
            url={lightboxUrl}
            onClose={() => setLightboxUrl(null)}
          />
        </>
      ) : (
        <div className="max-w-xs px-5 py-4 bg-orange-500 rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl">
          <p className="text-white text-sm leading-6">{msg.text}</p>
        </div>
      )}
      <p className="text-gray-500 text-xs pr-3">{msg.time}</p>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);

export type ProfilePopupData = {
  sitterId?: string | null;
  name: string;
  initial: string;
  profileImage?: string | null;
  location?: string;
  rating?: number;
  reviewCount?: number;
  services?: string[];
  career?: string;
};

type ProfilePopupProps = {
  data: ProfilePopupData;
  cardVariant?: "sitter" | "owner";
  onClose: () => void;
};

export function ProfilePopup({
  data,
  onClose,
  cardVariant = "sitter",
}: ProfilePopupProps) {
  const [fetchedProfile, setFetchedProfile] = useState<SitterProfile | null>(
    null,
  );
  const [resolvedSitterId, setResolvedSitterId] = useState<string | null>(null);
  const loadingProfile =
    cardVariant === "sitter" &&
    !!data.sitterId &&
    resolvedSitterId !== data.sitterId;

  useEffect(() => {
    if (cardVariant !== "sitter" || !data.sitterId) return;
    let cancelled = false;
    fetch(`/api/sitters/${data.sitterId}`)
      .then((res) => res.json())
      .then(({ data: d }) => {
        if (cancelled || !d) return;
        setFetchedProfile({
          name: d.full_name,
          initial: d.full_name?.charAt(0) ?? "",
          src: d.profile_image,
          verified: d.is_verified ?? false,
          location: d.available_area ?? "",
          rating: d.rating,
          reviewCount: d.review_count ?? 0,
          services:
            d.services?.map((s: { service_type: string }) => s.service_type) ??
            [],
          career: d.career ?? "",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setResolvedSitterId(data.sitterId ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [data.sitterId, cardVariant]);

  const profile: SitterProfile = fetchedProfile ?? {
    name: data.name,
    initial: data.initial,
    src: data.profileImage,
    verified: false,
    location: data.location ?? "",
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    services: data.services ?? [],
    career: data.career ?? "",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div className="relative w-80" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-orange-50 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
        {loadingProfile ? (
          <div className="bg-white border border-orange-100 rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.08)] overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-300" />
            <div className="p-8 flex items-center justify-center">
              <p className="text-stone-400 text-sm">불러오는 중...</p>
            </div>
          </div>
        ) : (
          <SitterProfileCard profile={profile} variant={cardVariant} />
        )}
      </div>
    </div>
  );
}

// 선택 확정 안내 카드 (보호자용)
type ConfirmationCardProps = {
  postTitle: string;
  sitterInitial: string;
  sitterProfileImage?: string | null;
  onGoToChat: () => void;
  onPostClick?: () => void;
};

export function ConfirmationCard({
  postTitle,
  sitterInitial,
  sitterProfileImage,
  onGoToChat,
  onPostClick,
}: ConfirmationCardProps) {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
        <div className="flex flex-col">
          <span className="text-[#6B7280] text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            예약 확정
          </span>
          <span className="text-[#281A0E] text-sm leading-5 mt-0.5">
            예약이 완료되었습니다!
            <br />
            1:1 채팅에서 결제를 진행해주세요.
          </span>
        </div>
        <div className="py-3">
          <button
            type="button"
            onClick={onPostClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-orange-100 rounded-xl hover:bg-orange-200 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-200 shrink-0 overflow-hidden flex items-center justify-center">
              {sitterProfileImage ? (
                <Image
                  src={sitterProfileImage}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-sm font-semibold text-orange-500">
                  {sitterInitial}
                </span>
              )}
            </div>
            <span className="text-[#374151] text-sm leading-5 truncate flex-1">
              {postTitle}
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={onGoToChat}
          className="w-full h-10 rounded-xl outline-[1.11px] outline-orange-500 outline-offset-[-1.11px] text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors"
        >
          1:1 채팅으로 이동
        </button>
      </div>
    </div>
  );
}

// 선택 확정 안내 카드 (펫시터용)
type SitterConfirmationCardProps = {
  postTitle: string;
  ownerInitial: string;
  ownerProfileImage?: string | null;
  onPostClick?: () => void;
  onGoToChat?: () => void;
};

export function SitterConfirmationCard({
  postTitle,
  ownerInitial,
  ownerProfileImage,
  onPostClick,
  onGoToChat,
}: SitterConfirmationCardProps) {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-orange-100 rounded-2xl outline-[1.11px] outline-orange-400 outline-offset-[-1.11px] flex flex-col">
        <div className="flex flex-col">
          <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            예약 확정
          </span>
          <span className="text-[#281A0E] text-sm leading-5 mt-0.5">
            예약이 완료되었습니다!
            <br />
            1:1 채팅에서 결제 내용을 확인해주세요.
          </span>
        </div>
        <div className="pt-3 pb-3">
          <button
            type="button"
            onClick={onPostClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-orange-200 rounded-xl hover:bg-orange-300 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-300 shrink-0 overflow-hidden flex items-center justify-center">
              {ownerProfileImage ? (
                <Image
                  src={ownerProfileImage}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-sm font-semibold text-orange-500">
                  {ownerInitial}
                </span>
              )}
            </div>
            <span className="text-[#374151] text-sm leading-5 truncate flex-1">
              {postTitle}
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={onGoToChat}
          className="w-full h-10 rounded-xl outline-[1.11px] outline-orange-500 outline-offset-[-1.11px] text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors"
        >
          1:1 채팅으로 이동
        </button>
      </div>
    </div>
  );
}

// 지원 거절 안내 카드 (보호자용)
export function OwnerRejectionCard() {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-red-800 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              지원 거절
            </span>
            <span className="text-[#111827] text-sm leading-5 mt-0.5">
              지원을 거절했습니다.
            </span>
          </div>
        </div>
        <p className="pt-3 text-[#6B7280] text-xs leading-5">
          아쉽게도 이번 지원은 거절되었습니다.
        </p>
      </div>
    </div>
  );
}

// 지원 거절 안내 카드 (펫시터용)
export function SitterRejectionCard() {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-red-800 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              지원 거절
            </span>
            <span className="text-[#111827] text-sm leading-5 mt-0.5">
              지원이 거절되었습니다.
            </span>
          </div>
        </div>
        <p className="pt-3 text-[#6B7280] text-xs leading-5">
          아쉽게도 이번 지원은 거절되었습니다.
        </p>
        <div className="pt-3">
          <div className="pt-1 border-t border-red-200">
            <p className="text-red-400 text-[11px] leading-[17.6px]">
              다른 구인글에 지원해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 예약 취소 안내 카드
export function ReservationCanceledCard({ sentByMe }: { sentByMe: boolean }) {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-red-800 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              예약 취소
            </span>
            <span className="text-[#111827] text-sm leading-5 mt-0.5">
              {sentByMe ? "예약을 취소했습니다." : "예약이 취소되었습니다."}
            </span>
          </div>
        </div>
        <p className="pt-3 text-[#6B7280] text-xs leading-5">
          {sentByMe
            ? "취소된 예약은 되돌릴 수 없습니다."
            : "상대방이 예약을 취소했습니다."}
        </p>
      </div>
    </div>
  );
}

// + 버튼 패널
type ChatPlusPanelProps = {
  onPaymentRequest?: () => void;
  onSendCareRecord?: () => void;
  onSendPhoto: () => void;
  onServiceStart?: () => void;
  onServiceComplete?: () => void;
  onReservationEdit?: () => void;
};

function ChatPlusPanelImpl({
  onPaymentRequest,
  onSendCareRecord,
  onSendPhoto,
  onServiceStart,
  onServiceComplete,
  onReservationEdit,
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
    onServiceStart
      ? { icon: PlayCircle, label: "서비스 시작", onClick: onServiceStart }
      : null,
    onServiceComplete
      ? { icon: CheckCircle, label: "서비스 완료", onClick: onServiceComplete }
      : null,
    onReservationEdit
      ? { icon: CalendarRange, label: "예약 수정", onClick: onReservationEdit }
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

export const ChatPlusPanel = memo(ChatPlusPanelImpl);

// + 버튼
type ChatInputProps = {
  input: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  showPlusButton: boolean;
  plusOpen?: boolean;
  onPlusToggle?: () => void;
  disabled?: boolean;
};

function ChatInputImpl({
  input,
  onChange,
  onSend,
  showPlusButton,
  plusOpen,
  onPlusToggle,
  disabled,
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
          onKeyDown={(e) =>
            e.key === "Enter" && !e.nativeEvent.isComposing && onSend?.()
          }
          placeholder="메시지를 입력하세요"
          className="flex-1 h-14 px-5 py-4 bg-orange-50 rounded-2xl text-base text-stone-900 placeholder-stone-900/50 outline-none"
        />
        <button
          onClick={onSend}
          disabled={disabled}
          className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export const ChatInput = memo(ChatInputImpl);

// 지원 목록 탭 : 구인글별 지원자 목록 그룹
type Post = {
  id: string;
  title: string;
  status: string;
};

type ApplicantPostGroupProps = {
  post: Post;
  applicants: Applicant[];
  isCollapsed: boolean;
  isOwner: boolean;
  selectedApplicantId: string | null;
  rejectedIds: Set<string>;
  confirmedId: string | null;
  editMode: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onReject: (id: string) => void;
  onConfirm: (id: string) => void;
  onSelect: (id: string) => void;
  onAvatarClick?: (id: string) => void;
  getApplicantBadge: (id: string) => Badge | null;
};

function ApplicantPostGroupImpl({
  post,
  applicants,
  isCollapsed,
  isOwner,
  selectedApplicantId,
  rejectedIds,
  confirmedId,
  editMode,
  onToggle,
  onDelete,
  onReject,
  onConfirm,
  onSelect,
  onAvatarClick,
  getApplicantBadge,
}: ApplicantPostGroupProps) {
  if (applicants.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between hover:bg-orange-100 transition-colors shrink-0"
      >
        <div className="text-left flex-1 min-w-0 mr-2">
          <p className="text-sm font-medium text-stone-900 truncate">
            {post.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            지원자 {applicants.length}명 · {post.status}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
        />
      </button>
      {!isCollapsed &&
        applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.id}
            applicant={applicant}
            badge={getApplicantBadge(applicant.id)}
            isRejected={rejectedIds.has(applicant.id)}
            isConfirmed={confirmedId === applicant.id}
            isSelected={selectedApplicantId === applicant.id}
            isOwner={isOwner}
            confirmedId={confirmedId}
            editMode={editMode}
            onDelete={onDelete}
            onReject={onReject}
            onConfirm={onConfirm}
            onSelect={onSelect}
            onAvatarClick={onAvatarClick}
          />
        ))}
    </div>
  );
}

export const ApplicantPostGroup = memo(ApplicantPostGroupImpl);

// 예약 목록 카드 (펫시터 찾기 직접 예약)
type ReservationRequestCardProps = {
  reservationRequest: ReservationRequest;
  isSelected: boolean;
  editMode: boolean;
  isSitter: boolean;
  actioningId: string | null;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  onAccept: (id: string) => void;
  onDelete: (id: string) => void;
  onAvatarClick?: (id: string) => void;
};

function ReservationRequestCardImpl({
  reservationRequest: rr,
  isSelected,
  editMode,
  isSitter,
  actioningId,
  onSelect,
  onReject,
  onAccept,
  onDelete,
  onAvatarClick,
}: ReservationRequestCardProps) {
  const isPending = rr.reservationStatus === "pending";
  const isAccepted = rr.reservationStatus === "accepted";
  const isCanceled = rr.reservationStatus === "canceled";
  const isActioning = actioningId === rr.id;

  return (
    <div
      onClick={() => {
        if (!editMode) onSelect(rr.id);
      }}
      className={`flex items-center border-b border-orange-100 transition-colors ${
        !editMode ? "cursor-pointer" : ""
      } ${isSelected && !editMode ? "bg-orange-50" : "hover:bg-stone-50"} ${
        isCanceled ? "opacity-50" : ""
      }`}
    >
      {editMode && canLeaveReservationRequest(rr) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(rr.id);
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
                onAvatarClick(rr.id);
              }
            }}
            className="shrink-0"
          >
            <Avatar initial={rr.initial} src={rr.profileImage} size="md" />
          </button>
          <span className="text-base font-semibold text-stone-900 flex-1 truncate">
            {rr.name}
          </span>
          {isPending && !isSitter && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-400 shrink-0">
              대기 중
            </span>
          )}
          {isPending && isSitter && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-500 shrink-0">
              요청 도착
            </span>
          )}
          {isAccepted && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-600 shrink-0">
              확정됨
            </span>
          )}
          {isCanceled && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-400 shrink-0">
              거절됨
            </span>
          )}
          <UnreadBadge count={rr.unread} />
        </div>
        {rr.sub && (
          <span className="inline-block max-w-full truncate text-xs font-medium px-2 py-0.5 mb-1.5 rounded-full bg-orange-100 text-orange-600">
            {rr.sub}
          </span>
        )}
        <p className="text-sm text-gray-400 truncate mb-1.5">
          &quot;{rr.preview}&quot;
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">{rr.time}</span>
          <RatingDisplay rating={rr.rating} />
        </div>
        {isPending && isSitter && !editMode && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(rr.id);
              }}
              disabled={isActioning}
              className="flex-1 py-1.5 text-xs text-gray-500 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              거절
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(rr.id);
              }}
              disabled={isActioning}
              className="flex-1 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-default transition-colors font-medium"
            >
              수락
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReservationRequestCard = memo(ReservationRequestCardImpl);

// 결제 요청 카드 (보호자용 - 결제하기 버튼 포함)
type PaymentRequestCardProps = {
  amount: number;
  reason: string;
  deadline: string;
  paid: boolean;
  onPay?: () => void;
  isPaying: boolean;
  otherInitial: string;
  otherProfileImage?: string | null;
  onPostClick?: () => void;
  costItems?: CostItem[];
  isExtra?: boolean;
};

export function PaymentRequestCard({
  amount,
  reason,
  deadline,
  paid,
  onPay,
  isPaying,
  otherInitial,
  otherProfileImage,
  onPostClick,
  costItems,
  isExtra,
}: PaymentRequestCardProps) {
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={otherInitial} src={otherProfileImage} size="sm" />
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-[#6B7280] text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            {isExtra ? "추가금 결제 요청" : "결제 요청"}
          </span>
          <span className="text-[#281A0E] text-sm leading-5 mt-0.5">
            {isExtra
              ? "추가금 결제 요청이 도착했어요."
              : "결제 요청이 도착했어요."}
          </span>
          <span className="text-[#6B7280] text-xs mt-1 leading-[19.5px]">
            완료될 때까지 봐주개가 결제 금액을 안전하게 보관해요.
          </span>
        </div>

        {onPostClick && (
          <button
            type="button"
            onClick={onPostClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-orange-100 rounded-xl text-left transition-colors hover:bg-orange-200"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-200 shrink-0 overflow-hidden flex items-center justify-center">
              {otherProfileImage ? (
                <Image
                  src={otherProfileImage}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-sm font-semibold text-orange-500">
                  {otherInitial}
                </span>
              )}
            </div>
            <span className="text-[#374151] text-sm leading-5 truncate flex-1">
              {reason}
            </span>
          </button>
        )}

        {costItems && costItems.length > 0 && (
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-[0.3px]">
              비용 상세 내역
            </span>
            <div className="flex flex-col gap-1 mt-0.5">
              {costItems.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="text-[#374151] text-xs font-medium">
                      {item.name}
                    </span>
                    <span className="text-orange-500 text-xs font-medium">
                      {Number(item.amount.replace(/,/g, "")).toLocaleString(
                        "ko-KR",
                      )}
                      원
                    </span>
                  </div>
                  {item.description && (
                    <span className="text-[#9CA3AF] text-[10px] leading-4">
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-orange-100 mt-1" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-xs">요청 금액</span>
            <span className="text-orange-500 text-xs">
              {amount.toLocaleString("ko-KR")} 원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-xs">결제 기한</span>
            <span className="text-[#374151] text-xs">{deadline}</span>
          </div>
        </div>

        {paid ? (
          <button
            disabled
            className="w-full h-10 rounded-xl bg-orange-50 outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] text-orange-400 text-sm cursor-default"
          >
            완료되었어요
          </button>
        ) : onPay ? (
          <button
            type="button"
            onClick={onPay}
            disabled={isPaying}
            className="w-full h-10 rounded-xl outline-[1.11px] outline-orange-500 outline-offset-[-1.11px] text-orange-500 text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {isPaying ? "결제 중..." : "결제하기"}
          </button>
        ) : amount <= 0 ? (
          <button
            disabled
            className="w-full h-10 rounded-xl bg-stone-50 outline-[1.11px] outline-stone-200 outline-offset-[-1.11px] text-stone-400 text-sm cursor-default"
          >
            결제할 수 없어요
          </button>
        ) : (
          <button
            disabled
            className="w-full h-10 rounded-xl bg-stone-50 outline-[1.11px] outline-stone-200 outline-offset-[-1.11px] text-stone-400 text-sm cursor-default"
          >
            새 결제 요청이 전송되었어요
          </button>
        )}
      </div>
    </div>
  );
}

// 결제 요청 알림 카드 (펫시터용 - 내가 요청 보낸 쪽)
type SitterPaymentRequestCardProps = {
  amount: number;
  reason: string;
  otherInitial: string;
  otherProfileImage?: string | null;
  onPostClick?: () => void;
  costItems?: CostItem[];
  isExtra?: boolean;
};

export function SitterPaymentRequestCard({
  amount,
  reason,
  otherInitial,
  otherProfileImage,
  onPostClick,
  costItems,
  isExtra,
}: SitterPaymentRequestCardProps) {
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-orange-100 rounded-2xl outline-[1.11px] outline-orange-400 outline-offset-[-1.11px] flex flex-col">
        <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
          {isExtra ? "추가금 결제 요청" : "결제 요청"}
        </span>
        <span className="text-[#281A0E] text-sm leading-5 mt-0.5">
          {isExtra ? "추가금 결제가 요청되었습니다." : "결제가 요청되었습니다."}
        </span>
        {onPostClick && (
          <button
            type="button"
            onClick={onPostClick}
            className="mt-3 w-full flex items-center gap-3 px-3 py-2.5 bg-orange-200 rounded-xl text-left transition-colors hover:bg-orange-300"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-300 shrink-0 overflow-hidden flex items-center justify-center">
              {otherProfileImage ? (
                <Image
                  src={otherProfileImage}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-sm font-semibold text-orange-500">
                  {otherInitial}
                </span>
              )}
            </div>
            <span className="text-[#374151] text-sm leading-5 truncate flex-1">
              {reason}
            </span>
          </button>
        )}

        {costItems && costItems.length > 0 && (
          <div className="mt-3 flex flex-col gap-1 px-1">
            <span className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-[0.3px]">
              비용 상세 내역
            </span>
            <div className="flex flex-col gap-1 mt-0.5">
              {costItems.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="text-[#374151] text-xs font-medium">
                      {item.name}
                    </span>
                    <span className="text-orange-500 text-xs font-medium">
                      {Number(item.amount.replace(/,/g, "")).toLocaleString(
                        "ko-KR",
                      )}
                      원
                    </span>
                  </div>
                  {item.description && (
                    <span className="text-[#9CA3AF] text-[10px] leading-4">
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-orange-300 mt-1" />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-xs">요청 금액</span>
            <span className="text-orange-500 text-xs font-medium">
              {amount.toLocaleString("ko-KR")} 원
            </span>
          </div>
        </div>
        <p className="mt-3 text-[#6B7280] text-xs leading-relaxed">
          보호자가 결제를 완료하면 알림을 드릴게요.
        </p>
      </div>
    </div>
  );
}

function formatServiceDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 서비스 완료 카드 (보호자용 - 확인 버튼 포함)
type ServiceCompleteCardProps = {
  confirmed: boolean;
  onConfirm: () => void;
  isConfirming: boolean;
  otherInitial: string;
  otherProfileImage?: string | null;
  data?: ServiceCompleteData;
};

export function ServiceCompleteCard({
  confirmed,
  onConfirm,
  isConfirming,
  otherInitial,
  otherProfileImage,
  data,
}: ServiceCompleteCardProps) {
  const hasInfo =
    data?.serviceTitle ||
    data?.petName ||
    data?.startDatetime ||
    data?.totalPrice !== undefined;
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={otherInitial} src={otherProfileImage} size="sm" />
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-[#10B981]" />
          </div>
          <div>
            <span className="text-[#065F46] text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              서비스 완료
            </span>
            <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
              펫시터가 서비스를 완료했어요.
            </p>
          </div>
        </div>
        {hasInfo && (
          <div className="flex flex-col gap-2 px-3 py-2.5 bg-orange-50 rounded-xl">
            {(data?.serviceTitle || data?.petName) && (
              <div className="flex items-center gap-1.5">
                {data?.serviceTitle && (
                  <span className="text-xs text-stone-700 font-medium">
                    {data.serviceTitle}
                  </span>
                )}
                {data?.serviceTitle && data?.petName && (
                  <span className="text-gray-300 text-xs">·</span>
                )}
                {data?.petName && (
                  <span className="text-xs text-stone-500">{data.petName}</span>
                )}
              </div>
            )}
            {data?.startDatetime && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">일정</span>
                <span className="text-[#374151] text-xs">
                  {formatServiceDate(data.startDatetime)}
                  {data.endDatetime
                    ? ` ~ ${formatServiceDate(data.endDatetime)}`
                    : ""}
                </span>
              </div>
            )}
            {data?.totalPrice !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">금액</span>
                <span className="text-orange-500 text-xs font-medium">
                  {data.totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
            )}
          </div>
        )}
        <p className="text-[#6B7280] text-xs leading-relaxed">
          서비스가 완료되었다면 확인 버튼을 눌러주세요.
        </p>
        {confirmed ? (
          <button
            disabled
            className="w-full h-10 rounded-xl bg-orange-50 outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] text-orange-400 text-sm cursor-default"
          >
            완료되었어요
          </button>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full h-10 rounded-xl outline-[1.11px] outline-orange-500 outline-offset-[-1.11px] text-orange-500 text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {isConfirming ? "처리 중..." : "확인"}
          </button>
        )}
      </div>
    </div>
  );
}

// 서비스 완료 알림 카드 (펫시터)
export function SitterServiceCompleteCard({
  data,
}: {
  data?: ServiceCompleteData;
}) {
  const hasInfo =
    data?.serviceTitle ||
    data?.petName ||
    data?.startDatetime ||
    data?.totalPrice !== undefined;
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-orange-100 rounded-2xl outline-[1.11px] outline-orange-400 outline-offset-[-1.11px] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-[#10B981]" />
          </div>
          <div>
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              서비스 완료
            </span>
            <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
              서비스를 완료했습니다.
            </p>
          </div>
        </div>
        {hasInfo && (
          <div className="flex flex-col gap-2 px-3 py-2.5 bg-orange-200 rounded-xl">
            {(data?.serviceTitle || data?.petName) && (
              <div className="flex items-center gap-1.5">
                {data?.serviceTitle && (
                  <span className="text-xs text-stone-700 font-medium">
                    {data.serviceTitle}
                  </span>
                )}
                {data?.serviceTitle && data?.petName && (
                  <span className="text-orange-300 text-xs">·</span>
                )}
                {data?.petName && (
                  <span className="text-xs text-stone-500">{data.petName}</span>
                )}
              </div>
            )}
            {data?.startDatetime && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">일정</span>
                <span className="text-[#374151] text-xs">
                  {formatServiceDate(data.startDatetime)}
                  {data.endDatetime
                    ? ` ~ ${formatServiceDate(data.endDatetime)}`
                    : ""}
                </span>
              </div>
            )}
            {data?.totalPrice !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">금액</span>
                <span className="text-orange-500 text-xs font-medium">
                  {data.totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
            )}
          </div>
        )}
        <p className="text-[#6B7280] text-xs leading-relaxed">
          보호자의 확인 후 서비스가 완료됩니다.
        </p>
      </div>
    </div>
  );
}

// 서비스 최종 완료 안내 카드 (보호자 확인 완료 - 보호자/펫시터 공통)
type ServiceCompletedCardProps = {
  sentByMe: boolean;
  senderInitial: string;
  senderProfileImage?: string | null;
  data?: ServiceCompleteData;
  canWriteReview?: boolean;
  onWriteReview?: () => void;
  onLeaveChat?: () => void;
};

export function ServiceCompletedCard({
  sentByMe,
  senderInitial,
  senderProfileImage,
  data,
  canWriteReview = false,
  onWriteReview,
  onLeaveChat,
}: ServiceCompletedCardProps) {
  const hasInfo =
    data?.serviceTitle ||
    data?.petName ||
    data?.startDatetime ||
    data?.totalPrice !== undefined;

  const inner = (
    <div
      className={`w-79.5 p-4 rounded-2xl flex flex-col gap-3 ${
        sentByMe
          ? "bg-orange-100 outline-[1.11px] outline-orange-400 outline-offset-[-1.11px]"
          : "bg-white outline-[1.11px] outline-orange-200 outline-offset-[-1.11px]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={18} className="text-[#10B981]" />
        </div>
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.3px] leading-4 ${
              sentByMe ? "text-orange-500" : "text-[#065F46]"
            }`}
          >
            서비스 완료
          </span>
          <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
            {sentByMe
              ? "서비스 완료를 확인했어요."
              : "보호자가 서비스 완료를 확인했어요."}
          </p>
        </div>
      </div>
      {hasInfo && (
        <div
          className={`flex flex-col gap-2 px-3 py-2.5 rounded-xl ${
            sentByMe ? "bg-orange-200" : "bg-orange-50"
          }`}
        >
          {(data?.serviceTitle || data?.petName) && (
            <div className="flex items-center gap-1.5">
              {data?.serviceTitle && (
                <span className="text-xs text-stone-700 font-medium">
                  {data.serviceTitle}
                </span>
              )}
              {data?.serviceTitle && data?.petName && (
                <span className="text-gray-300 text-xs">·</span>
              )}
              {data?.petName && (
                <span className="text-xs text-stone-500">{data.petName}</span>
              )}
            </div>
          )}
          {data?.startDatetime && (
            <div className="flex items-center gap-2">
              <span className="text-[#6B7280] text-xs shrink-0">일정</span>
              <span className="text-[#374151] text-xs">
                {formatServiceDate(data.startDatetime)}
                {data.endDatetime
                  ? ` ~ ${formatServiceDate(data.endDatetime)}`
                  : ""}
              </span>
            </div>
          )}
          {data?.totalPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[#6B7280] text-xs shrink-0">금액</span>
              <span className="text-orange-500 text-xs font-medium">
                {data.totalPrice.toLocaleString("ko-KR")}원
              </span>
            </div>
          )}
        </div>
      )}
      <p className="text-[#6B7280] text-xs leading-relaxed">
        {sentByMe
          ? "펫시터에게 완료 확인 소식이 전달되었어요."
          : "정산 및 리뷰 작성이 가능해요."}
      </p>
      <div className="flex flex-col gap-2">
        {canWriteReview && (
          <button
            type="button"
            onClick={onWriteReview}
            className="w-full h-10 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            후기 작성하기
          </button>
        )}
        <button
          type="button"
          onClick={onLeaveChat}
          className="w-full h-10 rounded-xl outline-[1.11px] outline-orange-500 outline-offset-[-1.11px] text-orange-500 text-sm hover:bg-orange-50 transition-colors"
        >
          채팅방 나가기
        </button>
      </div>
    </div>
  );

  if (sentByMe) {
    return <div className="flex justify-end">{inner}</div>;
  }
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
      {inner}
    </div>
  );
}

// 서비스 시작 알림 카드 (보호자용)
type ServiceStartCardProps = {
  otherInitial: string;
  otherProfileImage?: string | null;
  data?: ServiceCompleteData;
};

export function ServiceStartCard({
  otherInitial,
  otherProfileImage,
  data,
}: ServiceStartCardProps) {
  const hasInfo =
    data?.serviceTitle ||
    data?.petName ||
    data?.startDatetime ||
    data?.totalPrice !== undefined;
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={otherInitial} src={otherProfileImage} size="sm" />
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <PlayCircle size={18} className="text-orange-500" />
          </div>
          <div>
            <span className="text-orange-600 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              서비스 시작
            </span>
            <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
              서비스를 시작했습니다.
            </p>
          </div>
        </div>
        {hasInfo && (
          <div className="flex flex-col gap-2 px-3 py-2.5 bg-orange-50 rounded-xl">
            {(data?.serviceTitle || data?.petName) && (
              <div className="flex items-center gap-1.5">
                {data?.serviceTitle && (
                  <span className="text-xs text-stone-700 font-medium">
                    {data.serviceTitle}
                  </span>
                )}
                {data?.serviceTitle && data?.petName && (
                  <span className="text-gray-300 text-xs">·</span>
                )}
                {data?.petName && (
                  <span className="text-xs text-stone-500">{data.petName}</span>
                )}
              </div>
            )}
            {data?.startDatetime && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">일정</span>
                <span className="text-[#374151] text-xs">
                  {formatServiceDate(data.startDatetime)}
                  {data.endDatetime
                    ? ` ~ ${formatServiceDate(data.endDatetime)}`
                    : ""}
                </span>
              </div>
            )}
            {data?.totalPrice !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">금액</span>
                <span className="text-orange-500 text-xs font-medium">
                  {data.totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 서비스 시작 알림 카드 (펫시터용)
export function SitterServiceStartCard({
  data,
}: {
  data?: ServiceCompleteData;
}) {
  const hasInfo =
    data?.serviceTitle ||
    data?.petName ||
    data?.startDatetime ||
    data?.totalPrice !== undefined;
  return (
    <div className="flex justify-end">
      <div className="w-79.5 p-4 bg-orange-100 rounded-2xl outline-[1.11px] outline-orange-400 outline-offset-[-1.11px] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
            <PlayCircle size={18} className="text-orange-500" />
          </div>
          <div>
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              서비스 시작
            </span>
            <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
              서비스를 시작했습니다.
            </p>
          </div>
        </div>
        {hasInfo && (
          <div className="flex flex-col gap-2 px-3 py-2.5 bg-orange-200 rounded-xl">
            {(data?.serviceTitle || data?.petName) && (
              <div className="flex items-center gap-1.5">
                {data?.serviceTitle && (
                  <span className="text-xs text-stone-700 font-medium">
                    {data.serviceTitle}
                  </span>
                )}
                {data?.serviceTitle && data?.petName && (
                  <span className="text-orange-300 text-xs">·</span>
                )}
                {data?.petName && (
                  <span className="text-xs text-stone-500">{data.petName}</span>
                )}
              </div>
            )}
            {data?.startDatetime && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">일정</span>
                <span className="text-[#374151] text-xs">
                  {formatServiceDate(data.startDatetime)}
                  {data.endDatetime
                    ? ` ~ ${formatServiceDate(data.endDatetime)}`
                    : ""}
                </span>
              </div>
            )}
            {data?.totalPrice !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs shrink-0">금액</span>
                <span className="text-orange-500 text-xs font-medium">
                  {data.totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
            )}
          </div>
        )}
        <p className="text-[#6B7280] text-xs leading-relaxed">
          서비스가 시작되었습니다.
        </p>
      </div>
    </div>
  );
}

// 결제 완료 카드 (보호자 + 펫시터 모두)
type PaymentCompleteCardProps = {
  amount: number;
  sentByMe?: boolean;
  otherInitial?: string;
  otherProfileImage?: string | null;
};

export function PaymentCompleteCard({
  amount,
  sentByMe = true,
  otherInitial = "",
  otherProfileImage,
}: PaymentCompleteCardProps) {
  const inner = (
    <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={18} className="text-[#10B981]" />
        </div>
        <div>
          <span className="text-[#065F46] text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            결제 완료
          </span>
          <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
            결제가 완료되었어요!
          </p>
        </div>
      </div>

      <div className="w-full px-3 py-2 bg-orange-100 rounded-xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex justify-between items-center">
        <span className="text-[#6B7280] text-xs">결제 금액</span>
        <span className="text-orange-500 text-sm font-bold">
          {amount.toLocaleString("ko-KR")}원
        </span>
      </div>

      <div className="pt-3 border-t border-orange-200">
        <p className="text-[#9CA3AF] text-[11px] leading-[17.6px]">
          봐주개가 결제 금액을 안전하게 보관하고 있어요. 예약 완료 후 펫시터에게
          지급됩니다.
        </p>
      </div>
    </div>
  );

  if (!sentByMe) {
    return (
      <div className="flex items-start gap-3">
        <Avatar initial={otherInitial} src={otherProfileImage} size="sm" />
        {inner}
      </div>
    );
  }
  return <div className="flex justify-end">{inner}</div>;
}

// 예약 요청 메시지 카드
type ReservationRequestMessageCardProps = {
  data: ReservationRequestData;
  senderInitial: string;
  senderProfileImage?: string | null;
};

export function ReservationRequestMessageCard({
  data,
  senderInitial,
  senderProfileImage,
}: ReservationRequestMessageCardProps) {
  const inner = (
    <div
      className={`w-79.5 p-4 rounded-2xl flex flex-col gap-2 ${
        data.sentByMe
          ? "bg-orange-100 outline-[1.11px] outline-orange-400 outline-offset-[-1.11px]"
          : "bg-white outline-[1.11px] outline-orange-200 outline-offset-[-1.11px]"
      }`}
    >
      <div>
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.3px] leading-4 ${
            data.sentByMe ? "text-orange-500" : "text-[#6B7280]"
          }`}
        >
          예약 요청
        </span>
        <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
          {data.sentByMe ? "예약을 요청했습니다." : "예약 요청이 도착했어요."}
        </p>
      </div>
      <div
        className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl ${
          data.sentByMe ? "bg-orange-200" : "bg-orange-50"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-[#6B7280] text-xs shrink-0">서비스</span>
          <span className="text-[#374151] text-xs font-medium">
            {data.serviceTitle}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#6B7280] text-xs shrink-0">날짜</span>
          <span className="text-[#374151] text-xs">
            {formatServiceDate(data.startDatetime)}
            {data.endDatetime
              ? ` ~ ${formatServiceDate(data.endDatetime)}`
              : ""}
          </span>
        </div>
        {data.petNames.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-xs shrink-0">반려동물</span>
            <span className="text-[#374151] text-xs">
              {data.petNames.join(", ")}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[#6B7280] text-xs shrink-0">금액</span>
          <span className="text-orange-500 text-xs font-medium">
            {data.totalPrice.toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>
    </div>
  );

  if (data.sentByMe) {
    return <div className="flex justify-end">{inner}</div>;
  }
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
      {inner}
    </div>
  );
}

// 예약 확정 메시지 카드
type ReservationAcceptedMessageCardProps = {
  data: ReservationAcceptedData;
  senderInitial: string;
  senderProfileImage?: string | null;
};

export function ReservationAcceptedMessageCard({
  data,
  senderInitial,
  senderProfileImage,
}: ReservationAcceptedMessageCardProps) {
  const inner = (
    <div
      className={`w-79.5 p-4 rounded-2xl flex flex-col gap-2 ${
        data.sentByMe
          ? "bg-orange-100 outline-[1.11px] outline-orange-400 outline-offset-[-1.11px]"
          : "bg-white outline-[1.11px] outline-orange-200 outline-offset-[-1.11px]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={18} className="text-[#10B981]" />
        </div>
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.3px] leading-4 ${
              data.sentByMe ? "text-orange-500" : "text-[#065F46]"
            }`}
          >
            예약 확정
          </span>
          <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
            {data.sentByMe ? "예약을 수락했습니다." : "예약이 확정되었어요!"}
          </p>
        </div>
      </div>
      <div
        className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl ${
          data.sentByMe ? "bg-orange-200" : "bg-orange-50"
        }`}
      >
        {data.startDatetime && (
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-xs shrink-0">날짜</span>
            <span className="text-[#374151] text-xs">
              {formatServiceDate(data.startDatetime)}
              {data.endDatetime
                ? ` ~ ${formatServiceDate(data.endDatetime)}`
                : ""}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[#6B7280] text-xs shrink-0">금액</span>
          <span className="text-orange-500 text-xs font-medium">
            {data.totalPrice.toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>
      {!data.sentByMe && (
        <p className="text-[#6B7280] text-xs leading-relaxed">
          채팅에서 결제를 진행해주세요.
        </p>
      )}
    </div>
  );

  if (data.sentByMe) {
    return <div className="flex justify-end">{inner}</div>;
  }
  return (
    <div className="flex items-start gap-3">
      <Avatar initial={senderInitial} src={senderProfileImage} size="sm" />
      {inner}
    </div>
  );
}

// 예약 거절 메시지 카드
export function ReservationRejectedMessageCard({
  sentByMe,
}: {
  sentByMe: boolean;
}) {
  return (
    <div className={sentByMe ? "flex justify-end" : ""}>
      <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-red-800 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
              예약 거절
            </span>
            <span className="text-[#111827] text-sm leading-5 mt-0.5">
              {sentByMe
                ? "예약 요청을 거절했습니다."
                : "예약 요청이 거절되었습니다."}
            </span>
          </div>
        </div>
        <p className="pt-3 text-[#6B7280] text-xs leading-5">
          {sentByMe
            ? "거절된 예약은 되돌릴 수 없습니다."
            : "다른 펫시터에게 예약을 요청해보세요."}
        </p>
      </div>
    </div>
  );
}

// 예약 수정 요청 카드

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 예약 수정 승인 카드
export function ReservationEditAcceptedCard({
  sentByMe,
}: {
  sentByMe: boolean;
}) {
  return (
    <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#ECFDF5] rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={18} className="text-[#10B981]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[#065F46] text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            예약 수정 승인
          </span>
          <span className="text-[#111827] text-sm leading-5 mt-0.5">
            {sentByMe
              ? "예약 수정 요청을 승인했습니다."
              : "예약 수정이 승인되었습니다."}
          </span>
        </div>
      </div>
      <p className="pt-3 text-[#6B7280] text-xs leading-5">
        {sentByMe
          ? "예약 정보가 변경되었습니다."
          : "예약 일정이 변경되었습니다."}
      </p>
    </div>
  );
}

// 예약 수정 거절 카드
export function ReservationEditRejectedCard({
  sentByMe,
}: {
  sentByMe: boolean;
}) {
  return (
    <div className="w-79.5 p-4 bg-white rounded-2xl outline-[1.11px] outline-orange-200 outline-offset-[-1.11px] flex flex-col">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
          <XCircle size={18} className="text-red-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-red-800 text-[10px] font-bold uppercase tracking-[0.3px] leading-4">
            예약 수정 거절
          </span>
          <span className="text-[#111827] text-sm leading-5 mt-0.5">
            {sentByMe
              ? "예약 수정 요청을 거절했습니다."
              : "예약 수정 요청이 거절되었습니다."}
          </span>
        </div>
      </div>
      <p className="pt-3 text-[#6B7280] text-xs leading-5">
        기존 예약 일정이 유지됩니다.
      </p>
    </div>
  );
}

function EditDiffRow({
  label,
  original,
  proposed,
}: {
  label: string;
  original: string;
  proposed: string;
}) {
  const changed = original !== proposed;
  return (
    <div>
      <p className="text-[10px] text-stone-400 mb-0.5">{label}</p>
      {changed ? (
        <>
          <p className="text-xs text-stone-400 line-through">{original}</p>
          <p className="text-xs text-stone-900 font-medium">{proposed}</p>
        </>
      ) : (
        <p className="text-xs text-stone-600">{original}</p>
      )}
    </div>
  );
}

function ReservationEditCard({
  messageId,
  data,
  isProcessed,
  reservationEditAction,
  onConfirm,
  onReject,
}: {
  messageId: string;
  data: ReservationEditPayload;
  isProcessed: boolean;
  reservationEditAction?: ReservationEditActionState;
  onConfirm?: (
    messageId: string,
    reservationId: string,
    proposed: {
      start_datetime: string;
      end_datetime: string;
      memo?: string | null;
    },
  ) => void;
  onReject?: (messageId: string) => void;
}) {
  const isConfirming =
    reservationEditAction?.messageId === messageId &&
    reservationEditAction.type === "confirm";
  const isRejecting =
    reservationEditAction?.messageId === messageId &&
    reservationEditAction.type === "reject";
  const actionLocked = !!reservationEditAction;
  return (
    <div
      className={`w-79.5 p-4 rounded-2xl flex flex-col gap-3 ${
        data.sentByMe
          ? "bg-orange-100 outline-[1.11px] outline-orange-400 outline-offset-[-1.11px]"
          : "bg-white outline-[1.11px] outline-orange-200 outline-offset-[-1.11px]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <CalendarRange size={16} className="text-orange-500" />
        </div>
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.3px] leading-4 ${
              data.sentByMe ? "text-orange-500" : "text-[#6B7280]"
            }`}
          >
            예약 수정 요청
          </span>
          <p className="text-[#281A0E] text-sm leading-5 mt-0.5">
            {data.sentByMe
              ? "예약 수정을 요청했습니다."
              : "예약 수정 요청이 도착했어요."}
          </p>
        </div>
      </div>
      <div
        className={`flex flex-col gap-2 px-3 py-2.5 rounded-xl ${
          data.sentByMe ? "bg-orange-200" : "bg-orange-50"
        }`}
      >
        <EditDiffRow
          label="시작 일시"
          original={fmtDt(data.original.start_datetime)}
          proposed={fmtDt(data.proposed.start_datetime)}
        />
        <EditDiffRow
          label="종료 일시"
          original={fmtDt(data.original.end_datetime)}
          proposed={fmtDt(data.proposed.end_datetime)}
        />
        {(data.original.memo || data.proposed.memo) && (
          <EditDiffRow
            label="메모"
            original={data.original.memo || "(없음)"}
            proposed={data.proposed.memo || "(없음)"}
          />
        )}
      </div>
      {isProcessed ? (
        <p className="text-center text-xs text-stone-400">처리 완료</p>
      ) : data.sentByMe ? (
        <p className="text-center text-xs text-stone-400">
          상대방의 확인을 기다리고 있습니다
        </p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onReject?.(messageId)}
            disabled={actionLocked}
            className="flex-1 py-1.5 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRejecting ? "처리 중..." : "거절"}
          </button>
          <button
            onClick={() =>
              onConfirm?.(messageId, data.reservationId, data.proposed)
            }
            disabled={actionLocked}
            className="flex-1 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? "처리 중..." : "확인"}
          </button>
        </div>
      )}
    </div>
  );
}
