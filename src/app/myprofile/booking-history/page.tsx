"use client";

import { useState } from "react";
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
  date: string;
  time: string;
  location: string;
  petName: string;
  petType: string;
  price: number;
  reviewWritten?: boolean;
}

// 더미 데이터

const BOOKINGS: Booking[] = [
  {
    id: "1",
    bookingNo: "BK-20260601-001",
    serviceType: "방문돌봄",
    status: "in-progress",
    sitterName: "이서연",
    sitterRating: 4.9,
    date: "2026년 6월 2일 (화)",
    time: "14:00 – 17:00",
    location: "마포구 상수동",
    petName: "몽이",
    petType: "말티즈",
    price: 35000,
  },
  {
    id: "2",
    bookingNo: "BK-20260530-003",
    serviceType: "산책",
    status: "confirmed",
    sitterName: "김민지",
    sitterRating: 4.8,
    date: "2026년 6월 10일 (수)",
    time: "10:00 – 11:00",
    location: "강남구 역삼동",
    petName: "콩이",
    petType: "푸들",
    price: 25000,
  },
  {
    id: "3",
    bookingNo: "BK-20260520-008",
    serviceType: "위탁돌봄",
    status: "completed",
    sitterName: "박준호",
    sitterRating: 5.0,
    date: "2026년 5월 20일 (수)",
    time: "09:00 – 18:00",
    location: "용산구 한남동",
    petName: "몽이",
    petType: "말티즈",
    price: 80000,
    reviewWritten: false,
  },
  {
    id: "4",
    bookingNo: "BK-20260510-012",
    serviceType: "방문돌봄",
    status: "completed",
    sitterName: "최예진",
    sitterRating: 4.7,
    date: "2026년 5월 10일 (일)",
    time: "15:00 – 18:00",
    location: "성동구 성수동",
    petName: "콩이",
    petType: "푸들",
    price: 40000,
    reviewWritten: true,
  },
  {
    id: "5",
    bookingNo: "BK-20260505-006",
    serviceType: "산책",
    status: "cancelled",
    sitterName: "정수아",
    sitterRating: 4.6,
    date: "2026년 5월 5일 (화)",
    time: "08:00 – 09:00",
    location: "송파구 잠실동",
    petName: "몽이",
    petType: "말티즈",
    price: 20000,
  },
  {
    id: "6",
    bookingNo: "BK-20260428-002",
    serviceType: "위탁돌봄",
    status: "pending",
    sitterName: "강태윤",
    sitterRating: 4.5,
    date: "2026년 6월 20일 (토)",
    time: "10:00 – 19:00",
    location: "광진구 자양동",
    petName: "콩이",
    petType: "푸들",
    price: 55000,
  },
];

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

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const status = STATUS_CONFIG[booking.status];

  return (
    <div
      className="bg-white border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(232,116,42,0.06)]"
      style={{
        borderColor: booking.status === "completed" ? "#DFF3E6" : "#FFE9D6",
      }}
    >
      {/* 상단 행 */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#FFE9D6]">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: SERVICE_BADGE_COLOR[booking.serviceType] ?? "#FFF0E8",
              color: "#281A0E",
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
              className={`text-xs font-semibold px-3 py-1 rounded-full ${booking.reviewWritten ? "bg-[#F3F4F6] text-[#6B7280]" : "bg-[#FFF0E8] text-[#E8742A]"}`}
            >
              {booking.reviewWritten ? "후기 작성 완료" : "후기 작성 가능"}
            </span>
          )}
        </div>
        <span className="text-xs text-[#6B7280]">{booking.bookingNo}</span>
      </div>

      {/* 중앙 내용 */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#FFF0E8] rounded-full border border-[#FFE9D6] flex items-center justify-center shrink-0">
            <span className="text-[#E8742A] text-base font-semibold">
              {booking.sitterName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[#281A0E]">
                {booking.sitterName}
              </span>
              <div className="flex items-center gap-0.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-[#6B7280]">
                  {booking.sitterRating}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Calendar size={14} className="text-[#E8742A] shrink-0" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Clock size={14} className="text-[#E8742A] shrink-0" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <MapPin size={14} className="text-[#E8742A] shrink-0" />
                <span>{booking.location}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-xs text-[#281A0E]">
                🐾 {booking.petName} · {booking.petType}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-[#E8742A]">
              {booking.price.toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="px-6 pb-5 flex gap-2 border-t border-[#FFE9D6] pt-4">
        {booking.status === "pending" && (
          <button className="flex-1 h-10 rounded-xl border border-[#FFE9D6] text-[#6B7280] text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors">
            예약 취소
          </button>
        )}
        {booking.status === "confirmed" && (
          <>
            <button
              onClick={() => router.push("/chat")}
              className="flex-1 h-10 rounded-xl border border-[#FFE9D6] text-[#281A0E] text-sm font-medium hover:border-[#E8742A]/50 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={15} />
              채팅하기
            </button>
            <button className="flex-1 h-10 rounded-xl border border-[#FFE9D6] text-[#6B7280] text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors">
              예약 취소
            </button>
          </>
        )}
        {booking.status === "in-progress" && (
          <button
            onClick={() => router.push("/chat")}
            className="flex-1 h-10 rounded-xl bg-[#FFF0E8] text-[#E8742A] text-sm font-semibold hover:bg-[#FFE4D0] transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle size={15} />
            채팅하기
          </button>
        )}
        {booking.status === "completed" && (
          <>
            <button
              onClick={() => router.push(`/booking/${booking.id}`)}
              className="flex-1 h-10 rounded-xl border border-[#FFE9D6] text-[#281A0E] text-sm font-medium hover:border-[#E8742A]/50 transition-colors"
            >
              예약 상세보기
            </button>
            {!booking.reviewWritten ? (
              <button
                onClick={() => router.push("/reviews/write")}
                className="flex-1 h-10 rounded-xl bg-[#E8742A] text-white text-sm font-semibold hover:bg-[#D4621A] transition-colors"
              >
                후기 작성하기
              </button>
            ) : (
              <button
                disabled
                className="flex-1 h-10 rounded-xl bg-[#F3F4F6] text-[#6B7280] text-sm font-medium cursor-not-allowed"
              >
                후기 작성 완료
              </button>
            )}
          </>
        )}
        {booking.status === "cancelled" && (
          <button
            onClick={() => router.push(`/booking/${booking.id}`)}
            className="flex-1 h-10 rounded-xl border border-[#FFE9D6] text-[#6B7280] text-sm font-medium hover:border-[#E8742A]/50 transition-colors"
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

  const filtered = BOOKINGS.filter((b) => {
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
    all: BOOKINGS.length,
    "in-progress": BOOKINGS.filter((b) => b.status === "in-progress").length,
    confirmed: BOOKINGS.filter((b) => b.status === "confirmed").length,
    completed: BOOKINGS.filter((b) => b.status === "completed").length,
    cancelled: BOOKINGS.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <div className="hidden md:block">
        <Header />
      </div>

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">예약 내역</span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">예약 내역</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              진행 중인 예약과 지난 예약을 확인할 수 있어요
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 bg-white border border-[#FFE9D6] rounded-2xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#E8742A] text-white"
                  : "text-[#6B7280] hover:text-[#281A0E]"
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={`ml-1.5 text-xs ${activeTab === tab.id ? "text-white/80" : "text-[#9CA3AF]"}`}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 카드 목록 */}
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-white border border-[#FFE9D6] rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} className="text-[#FFD4AE]" />
            </div>
            <p className="font-semibold text-[#281A0E] mb-1">
              예약 내역이 없어요
            </p>
            <p className="text-sm text-[#6B7280]">새로운 예약을 만들어보세요</p>
            <Link
              href="/search"
              className="mt-6 px-6 py-3 bg-[#E8742A] text-white rounded-xl text-sm font-semibold hover:bg-[#D4621A] transition-colors"
            >
              펫시터 찾기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {paged.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-[#FFE9D6] flex items-center justify-center text-[#6B7280] hover:border-[#E8742A]/50 disabled:opacity-40 transition-colors"
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
                    : "border border-[#FFE9D6] text-[#6B7280] hover:border-[#E8742A]/50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-[#FFE9D6] flex items-center justify-center text-[#6B7280] hover:border-[#E8742A]/50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
