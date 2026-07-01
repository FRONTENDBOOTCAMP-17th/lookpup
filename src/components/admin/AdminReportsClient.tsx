"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Ban,
  PowerOff,
} from "lucide-react";
import { updateReport } from "@/app/actions/reports";
import {
  adminDemoteUser,
  adminCancelRequest,
  adminDeactivateService,
  adminSuspendUser,
  adminUnsuspendUser,
} from "@/app/actions/admin";

type ReportStatus = "pending" | "processing" | "completed" | "rejected";

interface Reporter {
  id: string;
  full_name: string | null;
  profile_image: string | null;
  email: string | null;
}

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  content: string | null;
  status: string;
  image_urls: string[] | null;
  admin_memo: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  reporter: Reporter | Reporter[] | null;
}

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "대기",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: "처리중",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Loader2 className="w-3.5 h-3.5" />,
  },
  completed: {
    label: "완료",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "반려",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: "사용자",
  sitter: "펫시터",
  request: "구인글",
  service: "서비스",
  reservation: "예약",
  review: "리뷰",
  message: "메시지",
};

const STATUS_FILTERS = [
  "all",
  "pending",
  "processing",
  "completed",
  "rejected",
] as const;

export interface AdminReportsClientProps {
  initialReports: Report[];
}

export default function AdminReportsClient({
  initialReports,
}: AdminReportsClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<ReportStatus>("pending");
  const [editMemo, setEditMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, string>>(
    {},
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? reports
        : reports.filter((r) => r.status === statusFilter),
    [reports, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reports.length };
    for (const r of reports) {
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [reports]);

  const getReporter = (report: Report): Reporter | null => {
    if (!report.reporter) return null;
    return Array.isArray(report.reporter)
      ? (report.reporter[0] ?? null)
      : report.reporter;
  };

  const startEdit = (report: Report) => {
    setEditingId(report.id);
    setEditStatus(report.status as ReportStatus);
    setEditMemo(report.admin_memo ?? "");
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const runAction = async (
    reportId: string,
    key: string,
    fn: () => Promise<{ error?: { message: string } }>,
  ) => {
    setActionLoading(key);
    const result = await fn();
    setActionLoading(null);
    if (result.error) {
      setActionResults((prev) => ({
        ...prev,
        [key]: `오류: ${result.error!.message}`,
      }));
    } else {
      setActionResults((prev) => ({ ...prev, [key]: "완료" }));
    }
  };

  const saveEdit = async (reportId: string) => {
    setSaving(true);
    setSaveError(null);
    const result = await updateReport({
      id: reportId,
      status: editStatus,
      admin_memo: editMemo || null,
    });
    setSaving(false);

    if (result.error) {
      setSaveError(result.error.message);
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: editStatus,
              admin_memo: editMemo || null,
              handled_at: result.data?.handled_at ?? r.handled_at,
            }
          : r,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">신고 관리</h1>
      <p className="text-sm text-gray-500 mb-8">
        총 {reports.length}건의 신고가 접수되었습니다.
      </p>

      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map((s) => {
          const active = statusFilter === s;
          const label = s === "all" ? "전체" : (STATUS_LABELS[s]?.label ?? s);
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
              <span
                className={`ml-1.5 text-xs ${active ? "text-orange-100" : "text-gray-400"}`}
              >
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          해당 상태의 신고가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((report) => {
            const reporter = getReporter(report);
            const statusMeta = STATUS_LABELS[report.status];
            const isExpanded = expandedId === report.id;
            const isEditing = editingId === report.id;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-stone-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {reporter?.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reporter.profile_image}
                        alt={reporter.full_name ?? ""}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {reporter?.full_name ?? "알 수 없음"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {reporter?.email ?? ""}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100 rounded-full shrink-0">
                    {TARGET_TYPE_LABELS[report.target_type] ?? report.target_type}
                  </span>

                  <span className="hidden sm:block text-sm text-stone-700 truncate flex-1">
                    {report.reason}
                  </span>

                  <span className="hidden md:block text-xs text-gray-400 shrink-0">
                    {report.created_at
                      ? format(new Date(report.created_at), "MM.dd HH:mm", { locale: ko })
                      : "-"}
                  </span>

                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0 ${statusMeta?.color ?? ""}`}
                  >
                    {statusMeta?.icon}
                    {statusMeta?.label ?? report.status}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-stone-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex flex-col gap-3">
                        <InfoRow label="신고 사유" value={report.reason} />
                        <InfoRow
                          label="대상 유형"
                          value={TARGET_TYPE_LABELS[report.target_type] ?? report.target_type}
                        />
                        <InfoRow label="대상 ID" value={report.target_id} mono />
                        {report.content && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">상세 내용</p>
                            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap bg-stone-50 rounded-xl px-4 py-3">
                              {report.content}
                            </p>
                          </div>
                        )}
                        {report.image_urls && report.image_urls.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">증거 사진</p>
                            <div className="flex flex-wrap gap-2">
                              {report.image_urls.map((url, i) => (
                                <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`증거 ${i + 1}`}
                                    className="w-20 h-20 object-cover rounded-xl border border-stone-100 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        {isEditing ? (
                          <>
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-2">처리 상태 변경</p>
                              <div className="grid grid-cols-2 gap-2">
                                {(["pending", "processing", "completed", "rejected"] as ReportStatus[]).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEditStatus(s)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                                      editStatus === s
                                        ? "border-orange-500 bg-orange-50 text-orange-700"
                                        : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
                                    }`}
                                  >
                                    {STATUS_LABELS[s].icon}
                                    {STATUS_LABELS[s].label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-2">관리자 메모</p>
                              <textarea
                                value={editMemo}
                                onChange={(e) => setEditMemo(e.target.value.slice(0, 500))}
                                placeholder="처리 내용을 입력하세요"
                                className="w-full h-28 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-orange-400 bg-white"
                              />
                              <div className="flex justify-end mt-0.5">
                                <span className="text-xs text-gray-400">{editMemo.length} / 500</span>
                              </div>
                            </div>

                            {saveError && <p className="text-xs text-red-500">{saveError}</p>}

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                className="flex-1 h-9 border border-stone-200 rounded-xl text-sm text-gray-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(report.id)}
                                disabled={saving}
                                className="flex-1 h-9 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                저장
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <InfoRow label="현재 상태" value={statusMeta?.label ?? report.status} />
                            {report.handled_at && (
                              <InfoRow
                                label="처리 일시"
                                value={format(new Date(report.handled_at), "yyyy.MM.dd HH:mm", { locale: ko })}
                              />
                            )}
                            {report.admin_memo && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-1">관리자 메모</p>
                                <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                                  {report.admin_memo}
                                </p>
                              </div>
                            )}

                            <AdminActions
                              report={report}
                              actionLoading={actionLoading}
                              actionResults={actionResults}
                              onDemote={(id, type) =>
                                runAction(report.id, `demote-${id}`, () => adminDemoteUser(id, type))
                              }
                              onCancelRequest={(id) =>
                                runAction(report.id, `cancel-${id}`, () => adminCancelRequest(id))
                              }
                              onDeactivateService={(id) =>
                                runAction(report.id, `deactivate-${id}`, () => adminDeactivateService(id))
                              }
                              onSuspend={(id, type, until) =>
                                runAction(report.id, `suspend-${id}`, () => adminSuspendUser(id, type, until))
                              }
                              onUnsuspend={(id, type) =>
                                runAction(report.id, `unsuspend-${id}`, () => adminUnsuspendUser(id, type))
                              }
                            />

                            <button
                              type="button"
                              onClick={() => startEdit(report)}
                              className="mt-auto h-9 w-full border border-orange-200 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors"
                            >
                              처리하기
                            </button>
                          </>
                        )}
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

interface AdminActionsProps {
  report: Report;
  actionLoading: string | null;
  actionResults: Record<string, string>;
  onDemote: (userId: string, targetType: "user" | "sitter") => void;
  onCancelRequest: (requestId: string) => void;
  onDeactivateService: (serviceId: string) => void;
  onSuspend: (targetId: string, targetType: "user" | "sitter", until: string) => void;
  onUnsuspend: (targetId: string, targetType: "user" | "sitter") => void;
}

function AdminActions({
  report,
  actionLoading,
  actionResults,
  onDemote,
  onCancelRequest,
  onDeactivateService,
  onSuspend,
  onUnsuspend,
}: AdminActionsProps) {
  const { target_type, target_id } = report;
  const [suspendDays, setSuspendDays] = useState("7");

  const isUser = target_type === "user" || target_type === "sitter";
  const isRequest = target_type === "request";
  const isService = target_type === "service";

  if (!isUser && !isRequest && !isService) return null;

  const demoteKey = `demote-${target_id}`;
  const cancelKey = `cancel-${target_id}`;
  const deactivateKey = `deactivate-${target_id}`;
  const suspendKey = `suspend-${target_id}`;
  const unsuspendKey = `unsuspend-${target_id}`;

  const handleSuspend = () => {
    const days = parseInt(suspendDays, 10);
    if (!days || days < 1) return;
    const until = new Date();
    until.setDate(until.getDate() + days);
    onSuspend(target_id, target_type as "user" | "sitter", until.toISOString());
  };

  return (
    <div className="border border-red-100 rounded-xl p-4 bg-red-50/40">
      <p className="text-xs font-semibold text-red-400 mb-3">관리 액션</p>
      <div className="flex flex-col gap-2">
        {isUser && (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-600">임시 정지</span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="w-16 border border-red-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
                />
                <span className="text-sm text-gray-500">일</span>
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={actionLoading === suspendKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === suspendKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ""}
                  정지
                </button>
                {actionResults[suspendKey] && (
                  <span className={`text-xs font-medium ${actionResults[suspendKey] === "완료" ? "text-green-600" : "text-red-500"}`}>
                    {actionResults[suspendKey]}
                  </span>
                )}
              </div>
            </div>

            <ActionButton
              label="정지 해제"
              description="정지 해제"
              loadingKey={unsuspendKey}
              actionLoading={actionLoading}
              result={actionResults[unsuspendKey]}
              onClick={() => onUnsuspend(target_id, target_type as "user" | "sitter")}
              color="orange"
            />

            <ActionButton
              label="펫시터 권한 강등"
              description="시터권한 강등"
              loadingKey={demoteKey}
              actionLoading={actionLoading}
              result={actionResults[demoteKey]}
              onClick={() => onDemote(target_id, target_type as "user" | "sitter")}
              color="red"
            />
          </>
        )}
        {isRequest && (
          <ActionButton
            label="구인글 취소"
            description="status → canceled"
            icon={<Ban className="w-4 h-4" />}
            loadingKey={cancelKey}
            actionLoading={actionLoading}
            result={actionResults[cancelKey]}
            onClick={() => onCancelRequest(target_id)}
            color="red"
          />
        )}
        {isService && (
          <ActionButton
            label="서비스 비활성화"
            description="is_active → false"
            icon={<PowerOff className="w-4 h-4" />}
            loadingKey={deactivateKey}
            actionLoading={actionLoading}
            result={actionResults[deactivateKey]}
            onClick={() => onDeactivateService(target_id)}
            color="orange"
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  description,
  icon,
  loadingKey,
  actionLoading,
  result,
  onClick,
  color,
}: {
  label: string;
  description: string;
  icon?: React.ReactNode;
  loadingKey: string;
  actionLoading: string | null;
  result?: string;
  onClick: () => void;
  color: "red" | "orange";
}) {
  const isLoading = actionLoading === loadingKey;
  const isDone = result === "완료";
  const isError = result?.startsWith("오류");

  const colorClass =
    color === "red"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-orange-200 text-orange-600 hover:bg-orange-50";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading || isDone}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (icon ?? null)}
        {label}
      </button>
      <span className="text-xs text-gray-400">{description}</span>
      {result && (
        <span className={`text-xs font-medium ${isDone ? "text-green-600" : isError ? "text-red-500" : "text-gray-500"}`}>
          {result}
        </span>
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
