"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Send,
  Pencil,
  Trash2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import SectionCard from "@/components/common/SectionCard";
import { CustomModal } from "@/components/common/CustomModal";
import BackButton from "@/components/common/BackButton";
import KakaoMap from "@/components/KakaoMap";
import { splitConditions } from "@/utils/boardConditions";
import {
  incrementViewCount,
  updateRequest,
  deleteRequest,
} from "@/app/actions/requests";
import { useUserStore } from "@/store/userStore";
import { createApplication } from "@/app/actions/applications";

const STATUS_MAP: Record<string, string> = {
  open: "모집중",
  matched: "매칭완료",
  completed: "완료",
  canceled: "취소",
};

type Pet = {
  id: string;
  name: string;
  animal_type: string;
  breed: string | null;
};
type Application = {
  id: string;
  message: string | null;
  proposed_price: number | null;
  status: string;
  sitters: {
    id: string;
    users: { full_name: string; profile_image: string | null } | null;
  } | null;
};
export type OtherPost = {
  id: string;
  title: string;
  location: string;
  budget: number;
  status: string;
  created_at: string;
};

export type RequestDetail = {
  id: string;
  owner_id: string;
  title: string;
  content: string | null;
  start_datetime: string;
  end_datetime: string;
  budget: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  view_count: number;
  created_at: string;
  users: {
    full_name: string;
    profile_image: string | null;
    is_verified: boolean;
    created_at: string;
  } | null;
  pets: Pet | null;
  applications: Application[];
};

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sStr = `${s.getMonth() + 1}월 ${s.getDate()}일`;
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  if (sameDay) return `${sStr} (당일)`;
  return `${sStr} - ${e.getMonth() + 1}월 ${e.getDate()}일`;
}

function formatClock(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const startSet = s.getSeconds() !== 30;
  const endSet = e.getSeconds() !== 30;
  if (startSet && endSet) return `${formatClock(s)} - ${formatClock(e)}`;
  if (startSet) return formatClock(s);
  if (endSet) return formatClock(e);
  return "시간 협의";
}

function formatRelativeTime(dateStr: string) {
  const diffH = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 3600000,
  );
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

function formatJoinDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function BoardDetailClient({
  id,
  initialPost,
  initialOtherPosts,
}: {
  id: string;
  initialPost?: RequestDetail | null;
  initialOtherPosts?: OtherPost[];
}) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const sitter = useUserStore((state) => state.sitter);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const currentUserId = user?.id;
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const applyCancelledRef = useRef(false);
  const applyInFlightRef = useRef(false);
  const [post, setPost] = useState<RequestDetail | null>(initialPost ?? null);
  const [postLoading, setPostLoading] = useState(!initialPost);
  const [otherPosts, setOtherPosts] = useState<OtherPost[] | null>(initialOtherPosts ?? null);

  useEffect(() => {
    if (initialPost !== undefined) return;
    fetch(`/api/requests/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if ("data" in result && result.data) {
          setPost(result.data as unknown as RequestDetail);
        }
      })
      .finally(() => setPostLoading(false));
  }, [id, initialPost]);

  useEffect(() => {
    incrementViewCount(id);
  }, [id]);

  const handleApply = async () => {
    if (!post?.id || applyInFlightRef.current) return;
    applyInFlightRef.current = true;
    setApplying(true);
    setApplyError(null);

    try {
      const result = await createApplication(post.id, {});

      if (result.error) {
        setApplyError(result.error.message);
        setShowApplyModal(false);
        return;
      }

      if (!applyCancelledRef.current) {
        setShowApplyModal(false);
        router.push(
          result.roomId ? `/chat?roomId=${result.roomId}` : "/chat?tab=applicants",
        );
      }
    } catch {
      setApplyError("일시적인 오류가 발생했습니다. 다시 시도해 주세요.");
      setShowApplyModal(false);
    } finally {
      applyInFlightRef.current = false;
      setApplying(false);
    }
  };

  useEffect(() => {
    if (initialOtherPosts !== undefined) return;
    if (!post?.owner_id) return;
    fetch(`/api/requests?owner_id=${post.owner_id}`)
      .then((res) => res.json())
      .then((result) => {
        if ("data" in result && result.data) {
          setOtherPosts(
            (result.data as OtherPost[])
              .filter((p) => p.id !== post.id)
              .slice(0, 3),
          );
        }
      });
  }, [post?.owner_id, post?.id, initialOtherPosts]);

  if (!post) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-orange-50 min-h-screen">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-20 text-center text-gray-400">
            {postLoading ? "불러오는 중..." : "게시글을 찾을 수 없습니다."}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const parsed = splitConditions(post.content ?? "");
  const conditionsText = parsed.conditions.trim();

  const isAuthor = !!currentUserId && currentUserId === post.owner_id;
  const isSitter = user?.role === "both" || user?.role === "admin";
  const isUnapprovedSitter = isSitter && !!sitter && sitter.status !== "approved";

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!isSitter) {
      router.push("/sitter-register");
      return;
    }
    if (isUnapprovedSitter) {
      setErrorMessage("승인 대기 중이거나 반려된 펫시터는 지원할 수 없습니다.");
      return;
    }
    applyCancelledRef.current = false;
    setApplyError(null);
    setShowApplyModal(true);
  };

  const handleClose = async () => {
    const result = await updateRequest(post.id, { status: "matched" });
    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }
    setPost((prev) => (prev ? { ...prev, status: "matched" } : prev));
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const result = await deleteRequest(deleteTargetId);
    setDeleteTargetId(null);
    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }
    router.push("/board");
  };

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6">
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <BackButton href="/board" />
              {isAuthor && (
                <div className="flex gap-2">
                  {post.status === "open" && (
                    <button
                      onClick={handleClose}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      모집마감
                    </button>
                  )}
                  <Link
                    href={`/board/${post.id}/edit`}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 text-xs font-medium flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Pencil size={12} />
                    수정
                  </Link>
                  <button
                    onClick={() => setDeleteTargetId(post.id)}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 text-xs font-medium flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Trash2 size={12} />
                    삭제
                  </button>
                </div>
              )}
            </div>
            <div className="hidden lg:block lg:w-96 shrink-0" aria-hidden />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            <div className="w-full flex-1 min-w-0 flex flex-col gap-6">
              <SectionCard className="overflow-hidden p-0 gap-0">
                <div className="h-64 bg-orange-50">
                  {post?.latitude && post?.longitude ? (
                    <KakaoMap
                      markers={[
                        {
                          id: post.id,
                          lat: post.latitude,
                          lng: post.longitude,
                          name: post.title,
                        },
                      ]}
                      center={{ lat: post.latitude, lng: post.longitude }}
                      level={5}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-7xl opacity-30">🐾</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-xs font-medium rounded-full">
                      {STATUS_MAP[post.status] ?? post.status}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4 text-gray-500 text-sm">
                      <span>{formatRelativeTime(post.created_at)}</span>
                      <span>조회 {post.view_count}</span>
                      <span>지원 {post.applications.length}명</span>
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
                    {post.title}
                  </h1>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">위치</p>
                        <p className="text-stone-900 text-base font-medium">
                          {post.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">기간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {formatPeriod(post.start_datetime, post.end_datetime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">시간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {formatTimeRange(
                            post.start_datetime,
                            post.end_datetime,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">급여</p>
                        <p className="text-orange-500 text-base font-medium">
                          {post.budget
                            ? `${post.budget.toLocaleString()}원`
                            : "협의 가능"}
                        </p>
                      </div>
                    </div>
                    {!isAuthor && (
                      <div className="flex gap-3 sm:col-span-2">
                        <button
                          onClick={handleApplyClick}
                          className="flex-1 h-11 flex items-center justify-center gap-2 bg-orange-500 rounded-[10px] text-white text-base font-medium hover:bg-orange-600 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          지원하기
                        </button>
                      </div>
                    )}
                    {applyError && (
                      <p className="sm:col-span-2 text-sm text-red-500 text-center">
                        {applyError}
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="text-stone-900 text-xl font-bold">상세 내용</h2>
                <p className="text-stone-900 text-base leading-7 whitespace-pre-line">
                  {parsed.content}
                </p>
              </SectionCard>

              {conditionsText && (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">
                    펫시터 조건
                  </h2>
                  <p className="text-stone-900 text-base leading-7 whitespace-pre-line">
                    {conditionsText}
                  </p>
                </SectionCard>
              )}

              {post.pets && (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">반려동물</h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 rounded-lg">
                      <span className="text-sm font-semibold text-stone-900">
                        {post.pets.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {post.pets.breed ?? post.pets.animal_type}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              )}

              {post && (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">
                    지원자 {post.applications.length}명
                  </h2>
                  {post.applications.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      아직 지원자가 없습니다.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {post.applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg"
                        >
                          <Avatar
                            initial={app.sitters?.users?.full_name?.[0] ?? "?"}
                            src={app.sitters?.users?.profile_image}
                            size="md"
                            variant="orange"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-stone-900 text-sm font-semibold">
                                {app.sitters?.users?.full_name ?? "알 수 없음"}
                              </span>
                              {app.proposed_price != null && (
                                <span className="text-orange-500 text-sm font-semibold">
                                  {app.proposed_price.toLocaleString()}원
                                </span>
                              )}
                            </div>
                            {app.message && (
                              <p className="text-stone-900 text-sm leading-5">
                                {app.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}
            </div>

            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6 lg:sticky lg:top-20">
              <SectionCard>
                <h3 className="text-stone-900 text-lg font-bold">
                  작성자 정보
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar
                    initial={post.users?.full_name?.[0] ?? "?"}
                    src={post.users?.profile_image}
                    size="lg"
                    variant="orange"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-stone-900 text-base font-semibold">
                        {post.users?.full_name ?? "알 수 없음"}
                      </span>
                      {post.users?.is_verified && (
                        <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium">
                          인증
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        가입{" "}
                        {post.users?.created_at
                          ? formatJoinDate(post.users.created_at)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-stone-900 text-lg font-bold">
                    {post.users?.full_name ?? "작성자"}님의 다른 게시물
                  </h3>
                  <Link
                    href="/board"
                    className="text-orange-500 text-xs font-medium hover:underline"
                  >
                    더보기
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {otherPosts === null ? (
                    <p className="text-gray-400 text-sm py-3 text-center">
                      불러오는 중...
                    </p>
                  ) : otherPosts.length === 0 ? (
                    <p className="text-gray-400 text-sm py-3 text-center">
                      다른 게시물이 없습니다.
                    </p>
                  ) : (
                    otherPosts
                      .map((p) => ({
                        id: p.id,
                        title: p.title,
                        district: p.location,
                        price: p.budget
                          ? `${p.budget.toLocaleString("ko-KR")}원`
                          : "협의 가능",
                        createdAt: formatRelativeTime(p.created_at),
                        status: STATUS_MAP[p.status] ?? p.status,
                      }))
                      .map((p) => (
                        <Link key={p.id} href={`/board/${p.id}`}>
                          <div className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-stone-900 text-sm font-medium flex-1 truncate pr-2">
                                {p.title}
                              </p>
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-medium ${
                                  p.status === "모집중"
                                    ? "bg-emerald-50 text-emerald-500"
                                    : "bg-orange-50 text-orange-500"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500 text-xs">
                                {p.district}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-orange-500 text-xs font-semibold">
                                {p.price}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {p.createdAt}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <CustomModal
        open={showApplyModal}
        preset="warning"
        title="지원하시겠습니까?"
        description="지원 후 채팅으로 보호자와 상담을 진행하세요."
        cancelText="취소"
        confirmText={applying ? "지원 중..." : "지원하기"}
        closeOnOverlay={!applying}
        closeOnEsc={!applying}
        onClose={() => {
          applyCancelledRef.current = true;
          setShowApplyModal(false);
        }}
        onConfirm={handleApply}
      />

      <CustomModal
        open={!!errorMessage}
        type="error"
        title="오류가 발생했습니다."
        description={errorMessage ?? undefined}
        confirmText="확인"
        onConfirm={() => setErrorMessage(null)}
        onClose={() => setErrorMessage(null)}
        showCloseButton={false}
      />

      {deleteTargetId && (
        <CustomModal
          open={!!deleteTargetId}
          type="danger"
          title="게시글 삭제"
          description="게시글을 삭제하면 복구할 수 없어요. 정말 삭제하시겠어요?"
          confirmText="삭제하기"
          cancelText="취소"
          onClose={() => setDeleteTargetId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
