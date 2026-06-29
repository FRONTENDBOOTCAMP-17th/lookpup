"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import { CustomModal } from "@/components/common/CustomModal";
import { getMyReservations, updateReservation } from "@/app/actions/reservations";
import { findOrCreateRoom } from "@/app/actions/chat";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";
type TabId = "all" | "in-progress" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  bookingNo: string;
  serviceType: string;
  status: BookingStatus;
  sitterName: string;
  sitterRating: number;
  sitterId: string;
  date: string;
  time: string;
  location: string;
  petName: string;
  petType: string;
  price: number;
  reviewWritten?: boolean;
}

// 상태 설정

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "예약 요청",
    bg: "#F3F4F6",
    text: "#6B7280",
    border: "#E5E7EB",
  },
  confirmed: {
    label: "예약 확정",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
  },
  "in-progress": {
    label: "진행중",
    bg: "#FFF7ED",
    text: "#EA580C",
    border: "#FED7AA",
  },
  completed: {
    label: "완료",
    bg: "#F0FDF4",
    text: "#16A34A",
    border: "#BBF7D0",
  },
  cancelled: {
    label: "취소",
    bg: "#FEF2F2",
    text: "#DC2626",
    border: "#FECACA",
  },
};

const SERVICE_BADGE_COLOR: Record<string, string> = {
  방문돌봄: "#FFF0E8",
  산책: "#E8F5FF",
  위탁돌봄: "#F0FDF4",
};

// 예약 카드 컴포넌트

function BookingCard({
  booking,
  onCancelRequest,
}: {
  booking: Booking;
  onCancelRequest: (id: string) => void;
}) {
  const router = useRouter();
  const status = STATUS_CONFIG[booking.status];

  async function handleChatClick() {
    const result = await findOrCreateRoom({ sitter_id: booking.sitterId, room_type: "direct" });
    if ("data" in result && result.data) {
      router.push(`/chat?roomId=${result.data.room_id}`);
    } else {
      router.push("/chat");
    }
  }

  return (
    <div className="bg-white border border-orange-100 rounded-2xl overflow-hidden shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)]">
      {/* 상단 행 */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full text-stone-900"
            style={{
              background: SERVICE_BADGE_COLOR[booking.serviceType] ?? "#FFF7ED",
            }}
          >
            {booking.serviceType}
          </span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{
              background: status.bg,
              color: status.text,
              borderColor: status.border,
            }}
          >
            {status.label}
          </span>
          {booking.status === "completed" && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${booking.reviewWritten ? "bg-gray-100 text-gray-500" : "bg-orange-50 text-orange-500"}`}
            >
              {booking.reviewWritten ? "후기 작성 완료" : "후기 작성 가능"}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{booking.bookingNo}</span>
      </div>

      {/* 중앙 내용 */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <Avatar initial={booking.sitterName[0]} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-stone-900">
                {booking.sitterName}
              </span>
              <div className="flex items-center gap-0.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-500">
                  {booking.sitterRating}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} className="text-orange-500 shrink-0" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} className="text-orange-500 shrink-0" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} className="text-orange-500 shrink-0" />
                <span>{booking.location}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-xs text-stone-900">
                🐾 {booking.petName} · {booking.petType}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-orange-500">
              {booking.price.toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="px-6 pb-5 flex gap-2 border-t border-orange-100 pt-4">
        {booking.status === "pending" && (
          // 예약 취소 기능 모달
          <button
            onClick={() => onCancelRequest(booking.id)}
            className="flex-1 h-10 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors"
          >
            예약 취소
          </button>
        )}
        {booking.status === "confirmed" && (
          <>
            <button
              onClick={handleChatClick}
              className="flex-1 h-10 rounded-xl border border-orange-100 text-stone-900 text-sm font-medium hover:border-orange-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={15} />
              채팅하기
            </button>
            {/* 예약 취소 기능 모달 */}
            <button
              onClick={() => onCancelRequest(booking.id)}
              className="flex-1 h-10 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors"
            >
              예약 취소
            </button>
          </>
        )}
        {booking.status === "in-progress" && (
          <>
            <button
              onClick={() =>
                router.push(`/myprofile/booking-history/${booking.id}`)
              }
              className="flex-1 h-10 rounded-xl border border-orange-100 text-stone-900 text-sm font-medium hover:border-orange-400 transition-colors"
            >
              예약 상세보기
            </button>
            <button
              onClick={handleChatClick}
              className="flex-1 h-10 rounded-xl bg-orange-50 text-orange-500 text-sm font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={15} />
              채팅하기
            </button>
          </>
        )}
        {booking.status === "completed" && (
          <>
            <button
              onClick={() =>
                router.push(`/myprofile/booking-history/${booking.id}`)
              }
              className="flex-1 h-10 rounded-xl border border-orange-100 text-stone-900 text-sm font-medium hover:border-orange-400 transition-colors"
            >
              예약 상세보기
            </button>
            {!booking.reviewWritten ? (
              <button
                onClick={() =>
                  router.push(
                    `/myprofile/reviews/write?bookingId=${booking.id}`,
                  )
                }
                className="flex-1 h-10 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                후기 작성하기
              </button>
            ) : (
              <button
                disabled
                className="flex-1 h-10 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"
              >
                후기 작성 완료
              </button>
            )}
          </>
        )}
        {booking.status === "cancelled" && (
          <button
            onClick={() =>
              router.push(`/myprofile/booking-history/${booking.id}`)
            }
            className="flex-1 h-10 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium hover:border-orange-400 transition-colors"
          >
            상세보기
          </button>
        )}
      </div>
    </div>
  );
}

// 메인 페이지

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "in-progress", label: "진행중" },
  { id: "confirmed", label: "예약확정" },
  { id: "completed", label: "완료" },
  { id: "cancelled", label: "취소" },
];

export default function BookingHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReservations().then(({ data }) => {
      setBookings((data ?? []) as Booking[]);
      setLoading(false);
    });
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancelingId) return;
    await updateReservation(cancelingId, { status: "canceled" });
    setCancelingId(null);
    getMyReservations().then(({ data }) =>
      setBookings((data ?? []) as Booking[]),
    );
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const counts: Record<TabId, number> = {
    all: bookings.length,
    "in-progress": bookings.filter((b) => b.status === "in-progress").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-stone-900" />
          </button>
          <span className="flex-1 font-semibold text-stone-900">예약 내역</span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">예약 내역</h2>
            <p className="text-sm text-gray-500 mt-1">
              진행 중인 예약과 지난 예약을 확인할 수 있어요
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 bg-white border border-orange-100 rounded-2xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:text-stone-900"
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={`ml-1.5 text-xs ${activeTab === tab.id ? "text-white/80" : "text-gray-400"}`}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 카드 목록 */}
        {loading ? (
          <div className="flex justify-center py-20 text-sm text-gray-500">
            불러오는 중...
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-white border border-orange-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} className="text-orange-200" />
            </div>
            <p className="font-semibold text-stone-900 mb-1">
              예약 내역이 없어요
            </p>
            <p className="text-sm text-gray-500">새로운 예약을 만들어보세요</p>
            <Link
              href="/petsitters"
              className="mt-6 px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
            >
              펫시터 찾기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {paged.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancelRequest={setCancelingId}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-orange-100 flex items-center justify-center text-gray-500 hover:border-orange-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                  page === p
                    ? "bg-[#E8742A] text-white"
                    : "border border-orange-100 text-gray-500 hover:border-orange-300"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-orange-100 flex items-center justify-center text-gray-500 hover:border-orange-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 예약 취소 기능 모달 */}
      <CustomModal
        open={cancelingId !== null}
        preset="cancelReservation"
        onClose={() => setCancelingId(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
