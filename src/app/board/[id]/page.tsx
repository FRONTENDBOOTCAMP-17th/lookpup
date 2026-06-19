"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Send,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Avatar from "@/components/ui/Avatar";
import SectionCard from "@/components/common/SectionCard";
import { CustomModal } from "@/components/common/CustomModal";
import BackButton from "@/components/common/BackButton";
import KakaoMap from "@/components/KakaoMap";
import { splitConditions } from "@/utils/boardConditions";

const STATUS_MAP: Record<string, string> = {
  open: "모집중",
  matched: "매칭완료",
  completed: "완료",
  canceled: "취소",
};

type Pet = { id: string; name: string; animal_type: string; breed: string | null };
type Application = {
  id: string;
  message: string | null;
  proposed_price: number | null;
  status: string;
  sitters: { id: string; users: { full_name: string } | null } | null;
};
type OtherPost = {
  id: string;
  title: string;
  location: string;
  budget: number;
  status: string;
  created_at: string;
};

type RequestDetail = {
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
  created_at: string;
  users: { full_name: string; profile_image: string | null; is_verified: boolean; created_at: string } | null;
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

// 입력한 시간만 표시. 입력창은 분 단위라 사용자 입력 시간은 초=0,
// 미입력 시 저장 마커는 초=30 → 초로 미입력 여부를 구분.
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
  const diffH = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

// 주소를 자치구(구) 단위까지만 표시 (동/상세주소 제거). 구가 없으면 시/군까지.
function toDistrict(location: string): string {
  const parts = location.trim().split(/\s+/);
  let guIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (/구$/.test(parts[i])) guIdx = i;
  }
  if (guIdx >= 0) return parts.slice(0, guIdx + 1).join(" ");
  const siGunIdx = parts.findIndex((p, i) => i > 0 && /[시군]$/.test(p));
  if (siGunIdx >= 0) return parts.slice(0, siGunIdx + 1).join(" ");
  return parts.slice(0, 2).join(" ");
}

function formatJoinDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// 더미 데이터 : 뭘눌러도 이것만 나와요 우하하~~~
// 실데이터 연결 후에도 fallback으로 사용 중 — post가 null이거나 해당 필드가 DB에 없는 경우 아래 값이 표시됨
// (예: POST.time, POST.priceNote, POST.requirements, POST.views, POST.author.rating 등)

const POST = {
  id: 1,
  category: "산책",
  status: "모집중",
  title: "강아지 산책 도우미 구합니다",
  createdAt: "2일 전",
  views: 245,
  applicants: 8,
  location: "서울 마포구 연남동",
  period: "2024.06.15 - 장기",
  time: "매일 오전 8:00-9:00",
  price: "시간당 20,000원",
  priceNote: "월 단위 결제",
  description: `안녕하세요! 저희 집 강아지 두 마리를 함께 산책시켜 주실 분을 찾고 있습니다.

매일 오전 8시-9시 사이에 1시간 정도 산책이 필요한데, 현재 업무 시간 때문에 어려워서 도움을 요청드립니다.

두 마리 모두 순하고 사람을 좋아하며, 다른 강아지들과도 잘 어울립니다. 산책 경험이 있으시고 책임감 있으신 분을 찾습니다.

관심 있으신 분은 연락 주세요. 감사합니다!`,
  requirements: [
    "강아지 산책 경험 필수",
    "매일 오전 8-9시 시간대 가능하신 분",
    "책임감 있고 성실하신 분",
    "반려동물에 대한 애정이 있으신 분",
  ],
  author: {
    id: 1,
    name: "김민수",
    initial: "김",
    district: "마포구",
    rating: 4.8,
    reviews: 12,
    joinDate: "2023.03",
    verified: true,
  },
};

const COMMENTS = [
  {
    id: 1,
    author: "이서연",
    initial: "이",
    createdAt: "1시간 전",
    content: "관심 있습니다! 강아지 산책 경험 많아요. 연락 주세요.",
    replyCount: 1,
  },
  {
    id: 2,
    author: "박준호",
    initial: "박",
    createdAt: "3시간 전",
    content: "평일 오전 시간대 가능합니다. 상세 내용 문의드립니다.",
    replyCount: 0,
  },
  {
    id: 3,
    author: "최예진",
    initial: "최",
    createdAt: "5시간 전",
    content: "주말도 가능한가요?",
    replyCount: 1,
  },
];

const SIMILAR_POSTS = [
  {
    id: 2,
    title: "고양이 방문 돌봄 구합니다",
    district: "마포구",
    price: "25,000원/시간",
    createdAt: "1일 전",
    status: "모집중",
  },
  {
    id: 3,
    title: "주말 강아지 위탁 돌봄",
    district: "용산구",
    price: "50,000원/일",
    createdAt: "3일 전",
    status: "모집중",
  },
  {
    id: 4,
    title: "소형견 산책 파트타임",
    district: "서대문구",
    price: "18,000원/시간",
    createdAt: "5일 전",
    status: "확정",
  },
];

const SAFETY_TIPS = [
  "플랫폼 내에서 안전하게 결제하세요",
  "직거래 시 신분증을 확인하세요",
  "계약서를 작성하는 것을 권장합니다",
];

// 페이지
export default function BoardDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [post, setPost] = useState<RequestDetail | null>(null);
  const [otherPosts, setOtherPosts] = useState<OtherPost[] | null>(null);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if ("data" in result && result.data) {
          setPost(result.data as unknown as RequestDetail);
        }
      });
  }, [id]);

  useEffect(() => {
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
  }, [post?.owner_id, post?.id]);

  // content에 함께 저장된 펫시터 조건을 본문/조건으로 분리
  const parsed = post ? splitConditions(post.content ?? "") : null;
  const conditionsText = parsed?.conditions.trim() ?? "";

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* 왼쪽 메인 콘텐츠 */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* 목록으로 */}
              <BackButton href="/board" />

              {/* 게시글 헤더 카드 */}
              <SectionCard className="overflow-hidden p-0 gap-0">
                {/* 위치 지도 */}
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
                  {/* 상태 + 메타 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-xs font-medium rounded-full">
                      {post ? STATUS_MAP[post.status] ?? post.status : POST.status}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4 text-gray-500 text-sm">
                      <span>{post ? formatRelativeTime(post.created_at) : POST.createdAt}</span>
                      <span>조회 {POST.views}</span>
                      <span>지원 {post?.applications.length ?? POST.applicants}명</span>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
                    {post?.title ?? POST.title}
                  </h1>

                  {/* 상세 정보 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">위치</p>
                        <p className="text-stone-900 text-base font-medium">
                          {post?.location ?? POST.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">기간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {post ? formatPeriod(post.start_datetime, post.end_datetime) : POST.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">시간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {post
                            ? formatTimeRange(
                                post.start_datetime,
                                post.end_datetime,
                              )
                            : POST.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">급여</p>
                        <p className="text-orange-500 text-base font-medium">
                          {post
                            ? post.budget
                              ? `${post.budget.toLocaleString()}원`
                              : "협의 가능"
                            : POST.price}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {POST.priceNote}
                        </p>
                      </div>
                    </div>
                    {/* 지원하기 버튼 */}
                    <div className="flex gap-3 sm:col-span-2">
                      {/* 지원하기 기능 모달 */}
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-orange-500 rounded-[10px] text-white text-base font-medium hover:bg-orange-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        지원하기
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 상세 내용 */}
              <SectionCard>
                <h2 className="text-stone-900 text-xl font-bold">상세 내용</h2>
                <p className="text-stone-900 text-base leading-7 whitespace-pre-line">
                  {parsed ? parsed.content : POST.description}
                </p>
              </SectionCard>

              {/* 펫시터 조건 — 실데이터(content에서 분리)가 있으면 표시, 없으면 더미 fallback */}
              {conditionsText ? (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">펫시터 조건</h2>
                  <p className="text-stone-900 text-base leading-7 whitespace-pre-line">
                    {conditionsText}
                  </p>
                </SectionCard>
              ) : (
                !post && (
                  <SectionCard>
                    <h2 className="text-stone-900 text-xl font-bold">요구사항</h2>
                    <ul className="flex flex-col gap-3">
                      {POST.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2.5 shrink-0" />
                          <span className="text-stone-900 text-base">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )
              )}

              {/* 반려동물 */}
              {post && post.pets && (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">반려동물</h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 rounded-lg">
                      <span className="text-sm font-semibold text-stone-900">{post.pets.name}</span>
                      <span className="text-xs text-gray-500">{post.pets.breed ?? post.pets.animal_type}</span>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* 지원자 목록 */}
              {post && (
                <SectionCard>
                  <h2 className="text-stone-900 text-xl font-bold">
                    지원자 {post.applications.length}명
                  </h2>
                  {post.applications.length === 0 ? (
                    <p className="text-gray-500 text-sm">아직 지원자가 없습니다.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {post.applications.map((app) => (
                        <div key={app.id} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                          <Avatar initial={app.sitters?.users?.full_name?.[0] ?? "?"} size="md" variant="orange" />
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
                              <p className="text-stone-900 text-sm leading-5">{app.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}

              {/* 댓글 */}
              <SectionCard>
                <h2 className="text-stone-900 text-xl font-bold">
                  댓글 {COMMENTS.length}
                </h2>

                {/* 댓글 입력 */}
                <div className="flex items-start gap-3 pb-6 border-b border-orange-100">
                  <Avatar initial="나" size="md" variant="orange" />
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      rows={3}
                      className="w-full p-3 rounded-lg border border-orange-100 text-stone-900 text-base placeholder:text-stone-900/40 outline-none resize-none focus:border-orange-300 transition-colors"
                    />
                    <div className="flex justify-end">
                      <button
                        className={`h-9 px-4 rounded-[10px] text-xs font-semibold transition-colors ${
                          comment.trim()
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "bg-orange-100 text-gray-300 cursor-not-allowed"
                        }`}
                        disabled={!comment.trim()}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="flex flex-col gap-6 pt-2">
                  {COMMENTS.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar initial={c.initial} size="md" variant="orange" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-stone-900 text-sm font-semibold">
                            {c.author}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {c.createdAt}
                          </span>
                        </div>
                        <p className="text-stone-900 text-sm leading-5 mb-2">
                          {c.content}
                        </p>
                        <button className="text-orange-500 text-xs font-medium hover:underline">
                          {c.replyCount > 0 ? `답글 ${c.replyCount}개` : "답글"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* 오른쪽 사이드바 */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6 lg:sticky lg:top-20">
              {/* 작성자 정보 */}
              <SectionCard>
                <h3 className="text-stone-900 text-lg font-bold">
                  작성자 정보
                </h3>
                <div className="flex items-start gap-3">
                  <Avatar
                    initial={post?.users?.full_name?.[0] ?? POST.author.initial}
                    size="lg"
                    variant="orange"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-stone-900 text-base font-semibold">
                        {post?.users?.full_name ?? POST.author.name}
                      </span>
                      {(post?.users?.is_verified ?? POST.author.verified) && (
                        <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium">
                          인증
                        </span>
                      )}
                    </div>
                    {/*
                      작성자 동네: users 테이블에 주소/지역 컬럼이 없어 실연동 불가.
                      임시로 작성자가 등록한 글의 주소(post.location)를 표시.
                      → 처음 등록한 글 주소 기준으로 구현해 둠.
                      추후 users에 region/address 컬럼 추가되면 그 값으로 교체 필요.
                    */}
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500 text-sm">
                        {post?.location
                          ? toDistrict(post.location)
                          : POST.author.district}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        가입 {post?.users?.created_at ? formatJoinDate(post.users.created_at) : POST.author.joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 작성자의 다른 글 */}
              <SectionCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-stone-900 text-lg font-bold">
                    {post?.users?.full_name ?? POST.author.name}님의 다른 게시물
                  </h3>
                  <Link
                    href="/board"
                    className="text-orange-500 text-xs font-medium hover:underline"
                  >
                    더보기
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {otherPosts !== null && otherPosts.length === 0 ? (
                    <p className="text-gray-400 text-sm py-3 text-center">
                      다른 게시물이 없습니다.
                    </p>
                  ) : (
                    (otherPosts === null
                      ? SIMILAR_POSTS.map((p) => ({
                          id: String(p.id),
                          title: p.title,
                          district: p.district,
                          price: p.price,
                          createdAt: p.createdAt,
                          status: p.status,
                        }))
                      : otherPosts.map((p) => ({
                          id: p.id,
                          title: p.title,
                          district: p.location,
                          price: p.budget
                            ? `${p.budget.toLocaleString("ko-KR")}원`
                            : "협의 가능",
                          createdAt: formatRelativeTime(p.created_at),
                          status: STATUS_MAP[p.status] ?? p.status,
                        }))
                    ).map((p) => (
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

      {/* 지원하기 기능 모달 */}
      <CustomModal
        open={showApplyModal}
        preset="warning"
        title="지원하시겠습니까?"
        description="지원 후 채팅으로 보호자와 상담을 진행하세요."
        cancelText="취소"
        confirmText="지원하기"
        onClose={() => setShowApplyModal(false)}
        onConfirm={() => {
          setShowApplyModal(false);
          router.push("/chat");
        }}
      />
    </>
  );
}
