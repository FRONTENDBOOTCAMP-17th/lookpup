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
} from "lucide-react";
import { adminUpdateSitterStatus, type SitterStatus } from "@/app/actions/admin";
import { SERVICES, ANIMALS } from "@/lib/sitterRegister";

interface UserInfo {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  profile_image: string | null;
}

interface Sitter {
  id: string;
  user_id: string;
  status: string;
  title: string | null;
  introduction: string | null;
  career: string | null;
  available_area: string | null;
  display_area: string | null;
  base_price: number | null;
  request_type: string[];
  available_animals: string[];
  certificate_urls: string[];
  activity_photo_urls: string[];
  created_at: string | null;
  users: UserInfo | UserInfo[] | null;
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
  approved: {
    label: "승인",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "반려",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const ALL_STATUSES: SitterStatus[] = ["pending", "approved", "rejected"];
const STATUS_FILTERS = ["all", ...ALL_STATUSES] as const;

const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s.title]),
);
const ANIMAL_LABEL: Record<string, string> = Object.fromEntries(
  ANIMALS.map((a) => [a.id, a.label]),
);

export default function AdminSittersClient({
  initialSitters,
}: {
  initialSitters: Sitter[];
}) {
  const [sitters, setSitters] = useState<Sitter[]>(initialSitters);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? sitters
        : sitters.filter((s) => s.status === statusFilter),
    [sitters, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sitters.length };
    for (const s of sitters) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [sitters]);

  const getUser = (s: Sitter): UserInfo | null => {
    if (!s.users) return null;
    return Array.isArray(s.users) ? (s.users[0] ?? null) : s.users;
  };

  const handleStatusChange = async (sitter: Sitter, newStatus: SitterStatus) => {
    const key = `${sitter.id}-${newStatus}`;
    setLoadingId(key);
    setErrors((prev) => ({ ...prev, [sitter.id]: "" }));

    const result = await adminUpdateSitterStatus(sitter.id, newStatus);

    setLoadingId(null);

    if (result.error) {
      setErrors((prev) => ({ ...prev, [sitter.id]: result.error!.message }));
      return;
    }

    setSitters((prev) =>
      prev.map((s) => (s.id === sitter.id ? { ...s, status: newStatus } : s)),
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">펫시터 승인 관리</h1>
      <p className="text-sm text-gray-500 mb-8">총 {sitters.length}건의 펫시터 신청이 있습니다.</p>

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
        <div className="text-center py-20 text-gray-400 text-sm">해당 상태의 펫시터가 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((sitter) => {
            const user = getUser(sitter);
            const statusMeta = STATUS_META[sitter.status];
            const isExpanded = expandedId === sitter.id;

            return (
              <div
                key={sitter.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-stone-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sitter.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {user?.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile_image}
                        alt={user.full_name ?? ""}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {user?.full_name ?? "알 수 없음"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
                    </div>
                  </div>

                  <span className="hidden sm:block text-sm text-stone-700 truncate flex-1">
                    {sitter.title ?? "-"}
                  </span>

                  <span className="hidden md:block text-xs text-gray-400 shrink-0">
                    {sitter.created_at
                      ? format(new Date(sitter.created_at), "MM.dd HH:mm", { locale: ko })
                      : "-"}
                  </span>

                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0 ${statusMeta?.color ?? ""}`}
                  >
                    {statusMeta?.icon}
                    {statusMeta?.label ?? sitter.status}
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
                        <InfoRow label="펫시터 ID" value={sitter.id} mono />
                        <InfoRow
                          label="신청자"
                          value={`${user?.full_name ?? "-"} (${user?.email ?? "-"})`}
                        />
                        <InfoRow label="연락처" value={user?.phone_number ?? "-"} />
                        <InfoRow label="활동 지역" value={sitter.display_area ?? sitter.available_area ?? "-"} />
                        <InfoRow label="경력" value={sitter.career ?? "-"} />
                        <InfoRow
                          label="기본 가격"
                          value={sitter.base_price != null ? `${sitter.base_price.toLocaleString()}원` : "-"}
                        />
                        <InfoRow
                          label="서비스"
                          value={
                            sitter.request_type.length > 0
                              ? sitter.request_type.map((t) => SERVICE_LABEL[t] ?? t).join(", ")
                              : "-"
                          }
                        />
                        <InfoRow
                          label="가능 동물"
                          value={
                            sitter.available_animals.length > 0
                              ? sitter.available_animals.map((a) => ANIMAL_LABEL[a] ?? a).join(", ")
                              : "-"
                          }
                        />
                        {sitter.introduction && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">소개</p>
                            <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                              {sitter.introduction}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        {sitter.certificate_urls.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">자격증</p>
                            <div className="flex flex-wrap gap-2">
                              {sitter.certificate_urls.map((url, i) => (
                                <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`자격증 ${i + 1}`}
                                    className="w-20 h-20 object-cover rounded-xl border border-stone-100 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {sitter.activity_photo_urls.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">활동 사진</p>
                            <div className="flex flex-wrap gap-2">
                              {sitter.activity_photo_urls.map((url, i) => (
                                <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`활동 사진 ${i + 1}`}
                                    className="w-20 h-20 object-cover rounded-xl border border-stone-100 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">현재 상태</p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded-full ${statusMeta?.color ?? ""}`}
                          >
                            {statusMeta?.icon}
                            {statusMeta?.label ?? sitter.status}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">상태 변경</p>
                          <div className="grid grid-cols-3 gap-2">
                            {ALL_STATUSES.map((s) => {
                              const meta = STATUS_META[s];
                              const key = `${sitter.id}-${s}`;
                              const isLoading = loadingId === key;
                              const isCurrent = sitter.status === s;

                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleStatusChange(sitter, s)}
                                  disabled={isLoading || isCurrent}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    isCurrent
                                      ? `${meta?.color} opacity-60`
                                      : s === "rejected"
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

                          {errors[sitter.id] && (
                            <p className="mt-2 text-xs text-red-500">{errors[sitter.id]}</p>
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
