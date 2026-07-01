"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  CalendarCheck,
} from "lucide-react";
import {
  adminUpdateReservationStatus,
  type ReservationStatus,
} from "@/app/actions/admin";

interface UserInfo {
  id: string;
  full_name: string | null;
  email: string | null;
  profile_image: string | null;
}

interface SitterInfo {
  id: string;
  user_id: string;
  users: UserInfo | UserInfo[] | null;
}

interface Reservation {
  id: string;
  status: string;
  total_price: number;
  start_datetime: string | null;
  end_datetime: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  paid_at: string | null;
  created_at: string | null;
  cancel_reason: string | null;
  memo: string | null;
  owner: UserInfo | UserInfo[] | null;
  sitter: SitterInfo | SitterInfo[] | null;
}

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "대기",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  accepted: {
    label: "수락됨",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <CalendarCheck className="w-3.5 h-3.5" />,
  },
  in_progress: {
    label: "진행중",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Play className="w-3.5 h-3.5" />,
  },
  completed: {
    label: "완료",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  canceled: {
    label: "취소",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const ALL_STATUSES: ReservationStatus[] = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "canceled",
];

const STATUS_FILTERS = ["all", ...ALL_STATUSES] as const;

export default function AdminStateClient({
  initialReservations,
}: {
  initialReservations: Reservation[];
}) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? reservations
        : reservations.filter((r) => r.status === statusFilter),
    [reservations, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    for (const r of reservations) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [reservations]);

  const getOwner = (r: Reservation): UserInfo | null => {
    if (!r.owner) return null;
    return Array.isArray(r.owner) ? (r.owner[0] ?? null) : r.owner;
  };

  const getSitterUser = (r: Reservation): UserInfo | null => {
    const sitter = Array.isArray(r.sitter) ? (r.sitter[0] ?? null) : r.sitter;
    if (!sitter?.users) return null;
    return Array.isArray(sitter.users) ? (sitter.users[0] ?? null) : sitter.users;
  };

  const handleStatusChange = async (reservation: Reservation, newStatus: ReservationStatus) => {
    const key = `${reservation.id}-${newStatus}`;
    setLoadingId(key);
    setErrors((prev) => ({ ...prev, [reservation.id]: "" }));

    const reason = newStatus === "canceled" ? (cancelReason[reservation.id] ?? "") : undefined;
    const result = await adminUpdateReservationStatus(reservation.id, newStatus, reason);

    setLoadingId(null);

    if (result.error) {
      setErrors((prev) => ({ ...prev, [reservation.id]: result.error!.message }));
      return;
    }

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservation.id
          ? {
              ...r,
              status: newStatus,
              accepted_at: newStatus === "accepted" ? new Date().toISOString() : r.accepted_at,
              started_at: newStatus === "in_progress" ? new Date().toISOString() : r.started_at,
              completed_at: newStatus === "completed" ? new Date().toISOString() : r.completed_at,
              canceled_at: newStatus === "canceled" ? new Date().toISOString() : r.canceled_at,
              cancel_reason: newStatus === "canceled" ? (cancelReason[reservation.id] ?? null) : r.cancel_reason,
            }
          : r,
      ),
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">예약 상태 관리</h1>
      <p className="text-sm text-gray-500 mb-8">총 {reservations.length}건의 예약이 있습니다.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map((s) => {
          const active = statusFilter === s;
          const label = s === "all" ? "전체" : (STATUS_META[s]?.label ?? s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${active ? "text-orange-100" : "text-gray-400"}`}>
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">해당 상태의 예약이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((reservation) => {
            const owner = getOwner(reservation);
            const sitterUser = getSitterUser(reservation);
            const statusMeta = STATUS_META[reservation.status];
            const isExpanded = expandedId === reservation.id;

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-stone-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : reservation.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {owner?.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={owner.profile_image}
                        alt={owner.full_name ?? ""}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {owner?.full_name ?? "알 수 없음"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{owner?.email ?? ""}</p>
                    </div>
                  </div>

                  <span className="hidden sm:block text-sm font-semibold text-stone-800 shrink-0">
                    {reservation.total_price.toLocaleString()}원
                  </span>

                  <span className="hidden md:block text-xs text-gray-400 shrink-0">
                    {reservation.start_datetime
                      ? format(new Date(reservation.start_datetime), "MM.dd HH:mm", { locale: ko })
                      : "-"}
                  </span>

                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0 ${statusMeta?.color ?? ""}`}
                  >
                    {statusMeta?.icon}
                    {statusMeta?.label ?? reservation.status}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-stone-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="flex flex-col gap-3">
                        <InfoRow label="예약 ID" value={reservation.id} mono />
                        <InfoRow
                          label="보호자"
                          value={`${owner?.full_name ?? "-"} (${owner?.email ?? "-"})`}
                        />
                        <InfoRow
                          label="시터"
                          value={`${sitterUser?.full_name ?? "-"} (${sitterUser?.email ?? "-"})`}
                        />
                        <InfoRow label="금액" value={`${reservation.total_price.toLocaleString()}원`} />
                        <InfoRow
                          label="서비스 기간"
                          value={
                            reservation.start_datetime && reservation.end_datetime
                              ? `${format(new Date(reservation.start_datetime), "yyyy.MM.dd HH:mm", { locale: ko })} ~ ${format(new Date(reservation.end_datetime), "MM.dd HH:mm", { locale: ko })}`
                              : "-"
                          }
                        />
                        {reservation.memo && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">메모</p>
                            <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                              {reservation.memo}
                            </p>
                          </div>
                        )}
                        {reservation.cancel_reason && (
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1">취소 사유</p>
                            <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
                              {reservation.cancel_reason}
                            </p>
                          </div>
                        )}

                        <div className="mt-1">
                          <p className="text-xs font-semibold text-gray-400 mb-2">타임라인</p>
                          <div className="flex flex-col gap-1">
                            {[
                              { label: "생성", value: reservation.created_at },
                              { label: "결제", value: reservation.paid_at },
                              { label: "수락", value: reservation.accepted_at },
                              { label: "시작", value: reservation.started_at },
                              { label: "완료", value: reservation.completed_at },
                              { label: "취소", value: reservation.canceled_at },
                            ]
                              .filter((t) => t.value)
                              .map((t) => (
                                <div key={t.label} className="flex items-center gap-2 text-xs">
                                  <span className="w-8 text-gray-400 font-medium shrink-0">{t.label}</span>
                                  <span className="text-stone-600">
                                    {format(new Date(t.value!), "yyyy.MM.dd HH:mm", { locale: ko })}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">현재 상태</p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded-full ${statusMeta?.color ?? ""}`}
                          >
                            {statusMeta?.icon}
                            {statusMeta?.label ?? reservation.status}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">상태 변경</p>

                          <div className="mb-3">
                            <label className="text-xs text-gray-400 mb-1 block">
                              취소 사유 (취소 선택 시)
                            </label>
                            <input
                              type="text"
                              value={cancelReason[reservation.id] ?? ""}
                              onChange={(e) =>
                                setCancelReason((prev) => ({ ...prev, [reservation.id]: e.target.value }))
                              }
                              placeholder="취소 사유를 입력하세요"
                              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {ALL_STATUSES.map((s) => {
                              const meta = STATUS_META[s];
                              const key = `${reservation.id}-${s}`;
                              const isLoading = loadingId === key;
                              const isCurrent = reservation.status === s;

                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleStatusChange(reservation, s)}
                                  disabled={isLoading || isCurrent}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    isCurrent
                                      ? `${meta?.color} opacity-60`
                                      : s === "canceled"
                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                        : "border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50"
                                  }`}
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    meta?.icon
                                  )}
                                  {meta?.label ?? s}
                                  {isCurrent && <span className="text-xs opacity-60">(현재)</span>}
                                </button>
                              );
                            })}
                          </div>

                          {errors[reservation.id] && (
                            <p className="mt-2 text-xs text-red-500">{errors[reservation.id]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-semibold text-gray-400 shrink-0 mt-0.5 w-20">{label}</span>
      <span className={`text-sm text-stone-700 break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
