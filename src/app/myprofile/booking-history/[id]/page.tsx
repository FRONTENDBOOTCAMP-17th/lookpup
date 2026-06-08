"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  ChevronLeft,
  CheckCircle2,
  Utensils,
  PawPrint,
  Camera,
  FileText,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

interface CareLogEntry {
  time: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}

interface Booking {
  id: string;
  bookingNo: string;
  serviceType: string;
  status: BookingStatus;
  sitter: {
    name: string;
    rating: number;
    reviewCount: number;
    certified: boolean;
  };
  date: string;
  time: string;
  location: string;
  pet: {
    name: string;
    breed: string;
    age: number;
    weight: number;
    emoji: string;
    gradient: string;
  };
  price: number;
  reviewWritten?: boolean;
  careLog?: CareLogEntry[];
}

// 더미 데이터

const BOOKINGS: Booking[] = [
  {
    id: "1",
    bookingNo: "BK-20260601-001",
    serviceType: "방문돌봄",
    status: "in-progress",
    sitter: { name: "이서연", rating: 4.9, reviewCount: 31, certified: true },
    date: "2026년 6월 2일 (화)",
    time: "14:00 – 17:00",
    location: "마포구 상수동",
    pet: {
      name: "몽이",
      breed: "말티즈",
      age: 3,
      weight: 3.2,
      emoji: "🐶",
      gradient: "linear-gradient(135deg, #FFE4C8, #FFB6A3)",
    },
    price: 35000,
    careLog: [
      {
        time: "14:05",
        icon: CheckCircle2,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        title: "방문 완료",
        desc: "이서연 펫시터가 도착했어요",
      },
      {
        time: "14:30",
        icon: PawPrint,
        iconBg: "#EFF6FF",
        iconColor: "#1D4ED8",
        title: "놀이 시간",
        desc: "몽이랑 신나게 놀고 있어요",
      },
      {
        time: "15:00",
        icon: Camera,
        iconBg: "#F3E5F5",
        iconColor: "#7B1FA2",
        title: "사진 전송",
        desc: "몽이가 잘 놀고 있어요 📸",
      },
    ],
  },
  {
    id: "2",
    bookingNo: "BK-20260530-003",
    serviceType: "산책",
    status: "confirmed",
    sitter: { name: "김민지", rating: 4.8, reviewCount: 22, certified: true },
    date: "2026년 6월 10일 (수)",
    time: "10:00 – 11:00",
    location: "강남구 역삼동",
    pet: {
      name: "콩이",
      breed: "푸들",
      age: 2,
      weight: 5.0,
      emoji: "🐩",
      gradient: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
    },
    price: 25000,
  },
  {
    id: "3",
    bookingNo: "BK-20260520-008",
    serviceType: "위탁돌봄",
    status: "completed",
    sitter: { name: "박준호", rating: 5.0, reviewCount: 48, certified: true },
    date: "2026년 5월 20일 (수)",
    time: "09:00 – 18:00",
    location: "용산구 한남동",
    pet: {
      name: "몽이",
      breed: "말티즈",
      age: 3,
      weight: 3.2,
      emoji: "🐶",
      gradient: "linear-gradient(135deg, #FFE4C8, #FFB6A3)",
    },
    price: 80000,
    reviewWritten: false,
    careLog: [
      {
        time: "09:15",
        icon: CheckCircle2,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        title: "방문 완료",
        desc: "박준호 펫시터가 도착했어요",
      },
      {
        time: "10:00",
        icon: Utensils,
        iconBg: "#FFF7ED",
        iconColor: "#EA580C",
        title: "식사 완료",
        desc: "아침 사료와 물을 챙겨줬어요",
      },
      {
        time: "11:30",
        icon: PawPrint,
        iconBg: "#EFF6FF",
        iconColor: "#1D4ED8",
        title: "산책 완료",
        desc: "30분 동안 공원 산책을 했어요",
      },
      {
        time: "14:00",
        icon: Camera,
        iconBg: "#F3E5F5",
        iconColor: "#7B1FA2",
        title: "사진 전송",
        desc: "몽이가 잘 놀고 있어요 📸",
      },
      {
        time: "17:00",
        icon: Utensils,
        iconBg: "#FFF7ED",
        iconColor: "#EA580C",
        title: "식사 완료",
        desc: "저녁 사료를 챙겨줬어요",
      },
      {
        time: "18:00",
        icon: CheckCircle2,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        title: "서비스 완료",
        desc: "오늘 돌봄이 마무리되었어요",
      },
    ],
  },
  {
    id: "4",
    bookingNo: "BK-20260510-012",
    serviceType: "방문돌봄",
    status: "completed",
    sitter: { name: "최예진", rating: 4.7, reviewCount: 15, certified: false },
    date: "2026년 5월 10일 (일)",
    time: "15:00 – 18:00",
    location: "성동구 성수동",
    pet: {
      name: "콩이",
      breed: "푸들",
      age: 2,
      weight: 5.0,
      emoji: "🐩",
      gradient: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
    },
    price: 40000,
    reviewWritten: true,
    careLog: [
      {
        time: "15:05",
        icon: CheckCircle2,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        title: "방문 완료",
        desc: "최예진 펫시터가 도착했어요",
      },
      {
        time: "15:30",
        icon: PawPrint,
        iconBg: "#EFF6FF",
        iconColor: "#1D4ED8",
        title: "산책 완료",
        desc: "동네 한 바퀴 산책했어요",
      },
      {
        time: "17:00",
        icon: Utensils,
        iconBg: "#FFF7ED",
        iconColor: "#EA580C",
        title: "식사 완료",
        desc: "저녁 사료를 챙겨줬어요",
      },
      {
        time: "18:00",
        icon: CheckCircle2,
        iconBg: "#F0FDF4",
        iconColor: "#16A34A",
        title: "서비스 완료",
        desc: "오늘 돌봄이 마무리되었어요",
      },
    ],
  },
  {
    id: "5",
    bookingNo: "BK-20260505-006",
    serviceType: "산책",
    status: "cancelled",
    sitter: { name: "정수아", rating: 4.6, reviewCount: 9, certified: false },
    date: "2026년 5월 5일 (화)",
    time: "08:00 – 09:00",
    location: "송파구 잠실동",
    pet: {
      name: "몽이",
      breed: "말티즈",
      age: 3,
      weight: 3.2,
      emoji: "🐶",
      gradient: "linear-gradient(135deg, #FFE4C8, #FFB6A3)",
    },
    price: 20000,
  },
  {
    id: "6",
    bookingNo: "BK-20260428-002",
    serviceType: "위탁돌봄",
    status: "pending",
    sitter: { name: "강태윤", rating: 4.5, reviewCount: 7, certified: false },
    date: "2026년 6월 20일 (토)",
    time: "10:00 – 19:00",
    location: "광진구 자양동",
    pet: {
      name: "콩이",
      breed: "푸들",
      age: 2,
      weight: 5.0,
      emoji: "🐩",
      gradient: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
    },
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

// 후기 섹션 컴포넌트

function ReviewSection({
  reviewWritten,
  onWrite,
}: {
  reviewWritten: boolean;
  onWrite: () => void;
}) {
  if (!reviewWritten) {
    return (
      <div className="bg-white border-2 border-[#E8742A] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#FFF0E8] rounded-xl flex items-center justify-center shrink-0">
            <Star size={20} className="text-[#E8742A]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#281A0E] mb-1">
              후기를 남겨주세요
            </p>
            <p className="text-sm text-[#6B7280]">
              소중한 경험을 다른 보호자와 공유해주세요
            </p>
          </div>
        </div>
        <button
          onClick={onWrite}
          className="w-full mt-5 h-12 rounded-xl bg-[#E8742A] text-white font-semibold hover:bg-[#D4621A] transition-colors"
        >
          후기 작성하기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-[#6B7280]" />
        <span className="font-semibold text-[#281A0E]">작성한 후기</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-sm text-[#6B7280] ml-1">5.0</span>
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {["친절해요", "꼼꼼해요", "믿을 수 있어요"].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-[#FFF8F3] border border-[#FFE9D6] rounded-full text-xs text-[#E8742A] font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-[#281A0E] leading-relaxed">
        몽이를 정말 잘 돌봐주셨어요. 중간중간 사진도 보내주시고 상태도 꼼꼼히
        확인해주셔서 안심이 됐습니다. 다음에도 꼭 부탁드리고 싶어요!
      </p>
    </div>
  );
}

// 페이지

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const booking = BOOKINGS.find((b) => b.id === id);
  const [reviewWritten, setReviewWritten] = useState(
    booking?.reviewWritten ?? false,
  );

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-[#281A0E] mb-2">
            예약 정보를 찾을 수 없어요
          </p>
          <button
            onClick={() => router.back()}
            className="text-sm text-[#E8742A] underline"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status];

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* 데스크탑 헤더 */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">예약 상세</span>
        </div>
      </div>

      <div className="w-full max-w-180 mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">예약 상세</h2>
            <p className="text-sm text-[#6B7280] mt-1">{booking.bookingNo}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 상태 요약 카드 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background:
                      SERVICE_BADGE_COLOR[booking.serviceType] ?? "#FFF0E8",
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
              </div>
              <span className="font-bold text-[#E8742A]">
                {booking.price.toLocaleString()}원
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                <Calendar size={15} className="text-[#E8742A] shrink-0" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                <Clock size={15} className="text-[#E8742A] shrink-0" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                <MapPin size={15} className="text-[#E8742A] shrink-0" />
                <span>{booking.location}</span>
              </div>
            </div>
          </div>

          {/* 반려동물 정보 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">
              반려동물 정보
            </h3>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: booking.pet.gradient }}
              >
                {booking.pet.emoji}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                <div>
                  <p className="text-xs text-[#6B7280]">이름</p>
                  <p className="text-sm font-semibold text-[#281A0E]">
                    {booking.pet.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">품종</p>
                  <p className="text-sm font-semibold text-[#281A0E]">
                    {booking.pet.breed}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">나이</p>
                  <p className="text-sm font-semibold text-[#281A0E]">
                    {booking.pet.age}살
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">몸무게</p>
                  <p className="text-sm font-semibold text-[#281A0E]">
                    {booking.pet.weight}kg
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 펫시터 정보 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">
              펫시터 정보
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFF0E8] rounded-full border border-[#FFE9D6] flex items-center justify-center shrink-0">
                <span className="text-[#E8742A] text-lg font-semibold">
                  {booking.sitter.name[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#281A0E]">
                    {booking.sitter.name}
                  </span>
                  {booking.sitter.certified && (
                    <span className="flex items-center gap-1 text-xs text-[#1976D2] bg-[#E3F2FD] px-2 py-0.5 rounded-full">
                      <BadgeCheck size={11} />
                      인증 완료
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">
                    {booking.sitter.rating}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    ({booking.sitter.reviewCount}건)
                  </span>
                </div>
              </div>
              {/* 진행중이거나 확정된 예약만 채팅 버튼 표시 */}
              {(booking.status === "in-progress" ||
                booking.status === "confirmed" ||
                booking.status === "pending") && (
                <button
                  onClick={() => router.push("/chat")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF0E8] text-[#E8742A] rounded-xl text-sm font-semibold hover:bg-[#FFE4D0] transition-colors shrink-0"
                >
                  <MessageCircle size={15} />
                  채팅
                </button>
              )}
            </div>
          </div>

          {/* 돌봄 기록 타임라인 - 기록이 있을 때만 표시 */}
          {booking.careLog && booking.careLog.length > 0 && (
            <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
              <h3 className="text-sm font-semibold text-[#6B7280] mb-5">
                돌봄 기록
              </h3>
              <div className="relative pl-6">
                {/* 타임라인 세로선 */}
                <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-[#FFE9D6]" />
                <div className="space-y-5">
                  {booking.careLog.map((log, idx) => {
                    const Icon = log.icon;
                    return (
                      <div
                        key={idx}
                        className="relative flex items-start gap-4"
                      >
                        {/* 타임라인 아이콘 노드 */}
                        <div
                          className="absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0"
                          style={{ background: log.iconBg }}
                        >
                          <Icon size={12} style={{ color: log.iconColor }} />
                        </div>
                        <div className="flex-1 pl-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-[#6B7280]">
                              {log.time}
                            </span>
                            <span className="font-semibold text-[#281A0E] text-sm">
                              {log.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280]">{log.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 결제 정보 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">
              결제 정보
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#281A0E]">서비스 금액</span>
              <span className="font-bold text-[#E8742A]">
                {booking.price.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 후기 섹션 - 완료 상태일 때만 표시 */}
          {booking.status === "completed" && (
            <ReviewSection
              reviewWritten={reviewWritten}
              onWrite={() => {
                router.push("/reviews/write");
                setReviewWritten(true);
              }}
            />
          )}

          {/* 예약 취소 버튼 - 요청/확정 상태일 때만 표시 */}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <button className="w-full h-12 rounded-xl border border-[#FFE9D6] text-[#6B7280] text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors">
              예약 취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
