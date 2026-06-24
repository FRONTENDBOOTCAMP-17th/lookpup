"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  ChevronLeft,
  FileText,
  BadgeCheck,
  ClipboardList,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { getReservationById } from "@/app/actions/reservations";
import { getCareRecordsByReservationId, type CareRecord } from "@/app/actions/care-records";
import { CARE_RECORD_TYPES } from "@/components/common/chat/CareRecordModal";
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
} from "@/components/ui/timeline";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

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
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: "예약 요청", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
  confirmed: { label: "예약 확정", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "in-progress": { label: "진행중", bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  completed: { label: "완료", bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  cancelled: { label: "취소", bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

const SERVICE_BADGE_COLOR: Record<string, string> = {
  방문돌봄: "#FFF0E8",
  산책: "#E8F5FF",
  위탁돌봄: "#F0FDF4",
};

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
            <p className="font-semibold text-[#281A0E] mb-1">후기를 남겨주세요</p>
            <p className="text-sm text-[#6B7280]">소중한 경험을 다른 보호자와 공유해주세요</p>
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
    </div>
  );
}

function CareRecordTimeline({ records }: { records: CareRecord[] }) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={18} className="text-[#E8742A]" />
        <h3 className="text-sm font-semibold text-[#281A0E]">돌봄 기록</h3>
        {records.length > 0 && (
          <span className="ml-auto text-xs text-[#E8742A] font-semibold bg-[#FFF0E8] px-2 py-0.5 rounded-full">
            {records.length}건
          </span>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-[#6B7280] text-center py-4">아직 등록된 돌봄 기록이 없어요</p>
      ) : (
        <Timeline>
          {records.map((record, index) => {
            const config = CARE_RECORD_TYPES.find((t) => t.type === record.type);
            const emoji = config?.emoji ?? "📋";
            const dt = new Date(record.created_at);
            const timeStr = dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
            const dateStr = dt.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
            const isLast = index === records.length - 1;

            return (
              <TimelineItem key={record.id}>
                {!isLast && (
                  <TimelineConnector className="bg-[#FFE9D6]" />
                )}
                <TimelineDot className="bg-[#FFF0E8] border-[#FFE9D6] text-base">
                  {emoji}
                </TimelineDot>
                <TimelineContent>
                  <TimelineHeader>
                    <TimelineTitle className="text-[#281A0E]">{record.title}</TimelineTitle>
                    <span className="text-xs text-white bg-[#E8742A] px-2 py-0.5 rounded-full leading-none">
                      {record.status_text}
                    </span>
                  </TimelineHeader>
                  <TimelineTime className="text-[#6B7280]">{dateStr} {timeStr}</TimelineTime>
                  {record.content && (
                    <TimelineDescription className="text-[#6B7280] mt-0.5">
                      {record.content}
                    </TimelineDescription>
                  )}
                  {record.image_urls.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {record.image_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`돌봄 사진 ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-xl border border-[#FFE9D6]"
                        />
                      ))}
                    </div>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviewWritten, setReviewWritten] = useState(false);
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    getReservationById(id).then((res) => {
      if ("error" in res || !res.data) {
        setNotFound(true);
      } else {
        setBooking(res.data as Booking);
        setReviewWritten(res.data.reviewWritten ?? false);
      }
      setLoading(false);
    });
    getCareRecordsByReservationId(id).then((res) => {
      if ("data" in res && res.data) {
        setCareRecords(res.data);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetch = () =>
      getCareRecordsByReservationId(id).then((res) => {
        if ("data" in res && res.data) setCareRecords(res.data);
      });

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">불러오는 중...</p>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-[#281A0E] mb-2">예약 정보를 찾을 수 없어요</p>
          <button onClick={() => router.back()} className="text-sm text-[#E8742A] underline">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status];

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
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
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">반려동물 정보</h3>
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
                  <p className="text-sm font-semibold text-[#281A0E]">{booking.pet.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">품종</p>
                  <p className="text-sm font-semibold text-[#281A0E]">{booking.pet.breed}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">나이</p>
                  <p className="text-sm font-semibold text-[#281A0E]">{booking.pet.age}살</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">몸무게</p>
                  <p className="text-sm font-semibold text-[#281A0E]">{booking.pet.weight}kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* 펫시터 정보 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">펫시터 정보</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFF0E8] rounded-full border border-[#FFE9D6] flex items-center justify-center shrink-0">
                <span className="text-[#E8742A] text-lg font-semibold">
                  {booking.sitter.name[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#281A0E]">{booking.sitter.name}</span>
                  {booking.sitter.certified && (
                    <span className="flex items-center gap-1 text-xs text-[#1976D2] bg-[#E3F2FD] px-2 py-0.5 rounded-full">
                      <BadgeCheck size={11} />
                      인증 완료
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{booking.sitter.rating}</span>
                  <span className="text-xs text-[#6B7280]">({booking.sitter.reviewCount}건)</span>
                </div>
              </div>
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

          {/* 결제 정보 */}
          <div className="bg-white border border-[#FFE9D6] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-4">결제 정보</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#281A0E]">서비스 금액</span>
              <span className="font-bold text-[#E8742A]">{booking.price.toLocaleString()}원</span>
            </div>
          </div>

          {/* 돌봄 기록 타임라인 */}
          <CareRecordTimeline records={careRecords} />

          {/* 후기 섹션 - 완료 상태일 때만 표시 */}
          {booking.status === "completed" && (
            <ReviewSection
              reviewWritten={reviewWritten}
              onWrite={() =>
                router.push(`/myprofile/reviews/write?bookingId=${booking.id}`)
              }
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
