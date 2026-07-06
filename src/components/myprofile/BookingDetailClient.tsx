"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  FileText,
  BadgeCheck,
  ClipboardList,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { MobileBackButton, DesktopBackButton } from "@/components/common/BackButton";
import SectionCard from "@/components/common/SectionCard";
import Avatar from "@/components/ui/Avatar";
import { getReservationById, cancelReservationAndNotify } from "@/app/actions/reservations";
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
import { ImageGallery } from "@/components/common/ImageGallery";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  bookingNo: string;
  serviceType: string;
  status: BookingStatus;
  sitter: {
    name: string;
    image?: string | null;
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
    imageUrl: string | null;
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
      <div className="bg-white border-2 border-[var(--color-orange-500)] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Star size={20} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-stone-900 mb-1">후기를 남겨주세요</p>
            <p className="text-sm text-gray-500">소중한 경험을 다른 보호자와 공유해주세요</p>
          </div>
        </div>
        <button
          onClick={onWrite}
          className="w-full mt-5 h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          후기 작성하기
        </button>
      </div>
    );
  }

  return (
    <SectionCard className="p-6 gap-0">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-gray-500" />
        <span className="font-semibold text-stone-900">작성한 후기</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-sm text-gray-500 ml-1">5.0</span>
      </div>
    </SectionCard>
  );
}

function CareRecordTimeline({ records }: { records: CareRecord[] }) {
  return (
    <SectionCard className="px-6 py-5 gap-0">
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={18} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-stone-900">돌봄 기록</h3>
        {records.length > 0 && (
          <span className="ml-auto text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
            {records.length}건
          </span>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">아직 등록된 돌봄 기록이 없어요</p>
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
                {!isLast && <TimelineConnector className="bg-orange-100" />}
                <TimelineDot className="bg-orange-50 border-orange-100 text-base">
                  {emoji}
                </TimelineDot>
                <TimelineContent>
                  <TimelineHeader>
                    <TimelineTitle className="text-stone-900">{record.title}</TimelineTitle>
                    <span className="text-xs text-white bg-orange-500 px-2 py-0.5 rounded-full leading-none">
                      {record.status_text}
                    </span>
                  </TimelineHeader>
                  <TimelineTime className="text-gray-500">{dateStr} {timeStr}</TimelineTime>
                  {record.content && (
                    <TimelineDescription className="text-gray-500 mt-0.5">
                      {record.content}
                    </TimelineDescription>
                  )}
                  {record.image_urls.length > 0 && (
                    <div className="mt-2">
                      <ImageGallery urls={record.image_urls} />
                    </div>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </SectionCard>
  );
}

export default function BookingDetailClient({
  id,
  initialBooking,
}: {
  id: string;
  initialBooking?: Booking | null;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(initialBooking ?? null);
  const [loading, setLoading] = useState(!initialBooking);
  const [notFound, setNotFound] = useState(false);
  const [reviewWritten, setReviewWritten] = useState(initialBooking?.reviewWritten ?? false);
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => {
    if (initialBooking) return;
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
  }, [id, initialBooking]);

  useEffect(() => {
    const fetchRecords = () =>
      getCareRecordsByReservationId(id).then((res) => {
        if ("data" in res && res.data) setCareRecords(res.data);
      });

    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-stone-900 mb-2">예약 정보를 찾을 수 없어요</p>
          <button onClick={() => router.back()} className="text-sm text-orange-500 underline">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status];

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <MobileBackButton />
          <span className="flex-1 font-semibold text-stone-900">예약 상세</span>
        </div>
      </div>

      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 pt-6 md:pt-12 pb-10 md:pb-20">
        <div className="hidden md:flex items-center gap-4 mb-8">
          <DesktopBackButton />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">예약 상세</h2>
            <p className="text-sm text-gray-500 mt-1">{booking.bookingNo}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard className="px-6 py-5 gap-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full text-stone-900"
                  style={{ background: SERVICE_BADGE_COLOR[booking.serviceType] ?? "#FFF7ED" }}
                >
                  {booking.serviceType}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ background: status.bg, color: status.text, borderColor: status.border }}
                >
                  {status.label}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-gray-500">총 결제 금액</span>
                <span className="font-bold text-orange-500">{booking.price.toLocaleString()}원</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Calendar size={15} className="text-orange-500 shrink-0" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Clock size={15} className="text-orange-500 shrink-0" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <MapPin size={15} className="text-orange-500 shrink-0" />
                <span>{booking.location}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="px-6 py-5 gap-0">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">반려동물 정보</h3>
            <div className="flex items-center gap-4">
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                style={{ background: booking.pet.gradient }}
              >
                {booking.pet.imageUrl ? (
                  <Image
                    src={booking.pet.imageUrl}
                    alt={booking.pet.name}
                    fill
                    sizes="56px"
                    preload
                    fetchPriority="high"
                    className="object-cover"
                  />
                ) : (
                  booking.pet.emoji
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                <div>
                  <p className="text-xs text-gray-500">이름</p>
                  <p className="text-sm font-semibold text-stone-900">{booking.pet.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">품종</p>
                  <p className="text-sm font-semibold text-stone-900">{booking.pet.breed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">나이</p>
                  <p className="text-sm font-semibold text-stone-900">{booking.pet.age}살</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">몸무게</p>
                  <p className="text-sm font-semibold text-stone-900">{booking.pet.weight}kg</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="px-6 py-5 gap-0">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">펫시터 정보</h3>
            <div className="flex items-center gap-4">
              <Avatar
                initial={booking.sitter.name[0]}
                src={booking.sitter.image}
                size="md"
                variant="orange"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-stone-900">{booking.sitter.name}</span>
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
                  <span className="text-xs text-gray-500">({booking.sitter.reviewCount}건)</span>
                </div>
              </div>
              {(booking.status === "in-progress" ||
                booking.status === "confirmed" ||
                booking.status === "pending") && (
                <Link
                  href="/chat"
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-500 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-colors shrink-0"
                >
                  <MessageCircle size={15} />
                  채팅
                </Link>
              )}
            </div>
          </SectionCard>

          <CareRecordTimeline records={careRecords} />

          {booking.status === "completed" && (
            <ReviewSection
              reviewWritten={reviewWritten}
              onWrite={() => router.push(`/myprofile/reviews/write?bookingId=${booking.id}`)}
            />
          )}

          {(booking.status === "pending" || booking.status === "confirmed") && (
            <>
              {cancelError && (
                <p className="text-xs text-red-500 text-center">{cancelError}</p>
              )}
              {cancelConfirm ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-center text-gray-500">
                    정말 예약을 취소할까요? 되돌릴 수 없습니다.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelConfirm(false)}
                      disabled={canceling}
                      className="flex-1 h-12 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      돌아가기
                    </button>
                    <button
                      onClick={async () => {
                        setCanceling(true);
                        setCancelError(null);
                        const res = await cancelReservationAndNotify(booking.id);
                        setCanceling(false);
                        if (res.error) {
                          setCancelError(res.error.message);
                          setCancelConfirm(false);
                          return;
                        }
                        setBooking((prev) => prev ? { ...prev, status: "cancelled" } : prev);
                        setCancelConfirm(false);
                      }}
                      disabled={canceling}
                      className="flex-1 h-12 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {canceling ? "처리 중..." : "취소 확인"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setCancelConfirm(true); setCancelError(null); }}
                  className="w-full h-12 rounded-xl border border-orange-100 text-gray-500 text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  예약 취소
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
