"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Dog,
  Calendar,
  Clock,
  MapPin,
  User,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { CustomModal } from "@/components/common/CustomModal";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

type PostStatus = "open" | "reserved" | "in-progress" | "completed" | "cancelled";
type TabId = "all" | "open" | "reserved" | "in-progress" | "completed" | "cancelled";
type SortType = "latest" | "status";

interface Post {
  id: string;
  title: string;
  status: PostStatus;
  petName: string;
  serviceType: string;
  date: string;
  time: string;
  location: string;
  price: number;
  createdAt: string;
  applicantCount?: number;
  sitterName?: string;
}

const DUMMY_POSTS: Post[] = [
  {
    id: "1",
    title: "말티즈 몽이 주말 방문 돌봄 부탁드려요",
    status: "open",
    petName: "몽이 (말티즈)",
    serviceType: "방문돌봄",
    date: "2026년 6월 14일 (토)",
    time: "10:00 – 14:00",
    location: "마포구 상수동",
    price: 40000,
    createdAt: "2026.06.08",
    applicantCount: 3,
  },
  {
    id: "2",
    title: "포메라니안 쿠키 산책 도우미 구합니다",
    status: "reserved",
    petName: "쿠키 (포메라니안)",
    serviceType: "산책",
    date: "2026년 6월 12일 (목)",
    time: "09:00 – 10:00",
    location: "서대문구 연희동",
    price: 20000,
    createdAt: "2026.06.06",
    sitterName: "박지수",
  },
  {
    id: "3",
    title: "골든리트리버 해피 호텔 숙박 부탁해요",
    status: "in-progress",
    petName: "해피 (골든리트리버)",
    serviceType: "펫호텔",
    date: "2026년 6월 10일 (화) – 6월 13일 (금)",
    time: "종일",
    location: "용산구 이태원동",
    price: 120000,
    createdAt: "2026.06.03",
    sitterName: "이서연",
  },
  {
    id: "4",
    title: "비숑 눈송이 주간 방문 돌봄 맡겨요",
    status: "completed",
    petName: "눈송이 (비숑프리제)",
    serviceType: "방문돌봄",
    date: "2026년 5월 20일 (화)",
    time: "11:00 – 15:00",
    location: "강남구 역삼동",
    price: 45000,
    createdAt: "2026.05.15",
    sitterName: "최민정",
  },
  {
    id: "5",
    title: "푸들 코코 산책 구인",
    status: "cancelled",
    petName: "코코 (토이푸들)",
    serviceType: "산책",
    date: "2026년 5월 10일 (금)",
    time: "08:00 – 09:00",
    location: "성동구 성수동",
    price: 18000,
    createdAt: "2026.05.07",
  },
];

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; badgeBg: string; badgeText: string }
> = {
  open: {
    label: "모집중",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-500",
  },
  reserved: {
    label: "예약완료",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-500",
  },
  "in-progress": {
    label: "진행중",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-500",
  },
  completed: {
    label: "완료",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
  },
  cancelled: {
    label: "취소됨",
    badgeBg: "bg-red-100",
    badgeText: "text-red-500",
  },
};

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "open", label: "모집중" },
  { id: "reserved", label: "예약완료" },
  { id: "in-progress", label: "진행중" },
  { id: "completed", label: "완료" },
  { id: "cancelled", label: "취소됨" },
];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

function countByStatus(posts: Post[], status: PostStatus) {
  return posts.filter((p) => p.status === status).length;
}

function PostCard({
  post,
  onDelete,
}: {
  post: Post;
  onDelete: (id: string) => void;
}) {
  const config = STATUS_CONFIG[post.status];
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_6px_rgba(232,116,42,0.10)] p-5 flex flex-col gap-4">
      {/* 제목 + 상태 배지 */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-stone-900 leading-5 flex-1">
          {post.title}
        </span>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${config.badgeBg} ${config.badgeText}`}
        >
          {post.status === "open" && <CheckCircle size={10} />}
          {post.status === "reserved" && <CheckCircle size={10} />}
          {post.status === "in-progress" && (
            <span className="size-2 rounded-full bg-orange-500 shrink-0" />
          )}
          {post.status === "completed" && <CheckCircle size={10} />}
          {post.status === "cancelled" && <XCircle size={10} />}
          {config.label}
        </span>
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <Dog size={12} className="text-orange-500 shrink-0" />
          <span className="text-xs text-gray-500">{post.petName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-orange-500 shrink-0" />
          <span className="text-xs text-gray-500">{post.serviceType}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-orange-500 shrink-0" />
          <span className="text-xs text-gray-500">{post.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-orange-500 shrink-0" />
          <span className="text-xs text-gray-500">{post.time}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <MapPin size={12} className="text-orange-500 shrink-0" />
          <span className="text-xs text-gray-500">{post.location}</span>
        </div>
      </div>

      <div className="border-t border-orange-100" />

      {/* 가격 + 지원자/시터 + 작성일 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-orange-500">
          {formatPrice(post.price)}
        </span>
        {post.applicantCount !== undefined ? (
          <div className="flex items-center gap-1">
            <User size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">
              지원자 {post.applicantCount}명
            </span>
          </div>
        ) : post.sitterName ? (
          <div className="flex items-center gap-1">
            <User size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">
              펫시터 {post.sitterName}
            </span>
          </div>
        ) : (
          <div />
        )}
        <span className="text-xs text-gray-400">작성 {post.createdAt}</span>
      </div>

      {/* 액션 버튼 */}
      {post.status === "open" ? (
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500 text-xs hover:bg-orange-100 transition-colors">
            상세보기
          </button>
          <button className="flex-1 py-2 bg-orange-500 rounded-xl text-white text-xs flex items-center justify-center gap-1 hover:bg-orange-600 transition-colors">
            <Pencil size={10} />
            수정하기
          </button>
          <button className="flex-1 py-2 bg-gray-100 rounded-xl text-gray-500 text-xs hover:bg-gray-200 transition-colors">
            모집마감
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="flex-1 py-2 bg-red-100 rounded-xl text-red-500 text-xs flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
          >
            <Trash2 size={10} />
            삭제
          </button>
        </div>
      ) : (post.status === "completed" || post.status === "cancelled") ? (
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500 text-xs hover:bg-orange-100 transition-colors">
            상세보기
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="flex-1 py-2 bg-red-100 rounded-xl text-red-500 text-xs flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
          >
            <Trash2 size={10} />
            삭제
          </button>
        </div>
      ) : (
        <button className="w-full py-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500 text-xs hover:bg-orange-100 transition-colors">
          상세보기
        </button>
      )}
    </div>
  );
}

export default function PostsManagePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filtered =
    activeTab === "all"
      ? posts
      : posts.filter((p) =>
          activeTab === "open"
            ? p.status === "open"
            : activeTab === "reserved"
              ? p.status === "reserved"
              : activeTab === "in-progress"
                ? p.status === "in-progress"
                : activeTab === "completed"
                  ? p.status === "completed"
                  : p.status === "cancelled",
        );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "status") {
      const order: PostStatus[] = [
        "open",
        "reserved",
        "in-progress",
        "completed",
        "cancelled",
      ];
      return order.indexOf(a.status) - order.indexOf(b.status);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const confirmDelete = () => {
    if (deleteTargetId) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const tabCounts: Record<TabId, number> = {
    all: posts.length,
    open: countByStatus(posts, "open"),
    reserved: countByStatus(posts, "reserved"),
    "in-progress": countByStatus(posts, "in-progress"),
    completed: countByStatus(posts, "completed"),
    cancelled: countByStatus(posts, "cancelled"),
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      {/* PC 헤더 */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* 모바일/태블릿 헤더 */}
      <MobileHeader />

      <div className="flex-1 w-full max-w-[820px] mx-auto px-5 lg:px-6 pt-6 pb-32 lg:pb-10">
        {/* 페이지 타이틀 (모바일+PC 공통) */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">게시글 관리</h1>
            <p className="text-sm text-gray-400">
              작성한 돌봄 요청글을 확인하고 관리할 수 있어요.
            </p>
          </div>
        </div>

        {/* 탭 필터 */}
        <div className="flex flex-wrap gap-2 mt-6 lg:flex-nowrap lg:overflow-x-auto lg:gap-1 pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                  isActive
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-white border border-orange-100 text-gray-500"
                }`}
              >
                {tab.label}{" "}
                <span className={isActive ? "text-white/80" : "text-gray-400"}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 총 건수 + 정렬 */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <span className="text-xs text-gray-400">총 {sorted.length}건</span>
          <div className="flex gap-1">
            {(["latest", "status"] as SortType[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sort === s
                    ? "bg-stone-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s === "latest" ? "최신순" : "상태순"}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="flex flex-col gap-3">
          {sorted.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              게시글이 없습니다.
            </div>
          ) : (
            sorted.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(id) => setDeleteTargetId(id)}
              />
            ))
          )}
        </div>
      </div>

      {/* 모바일/태블릿 바텀 네비 */}
      <MobileBottomNav />

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <CustomModal
          open={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={confirmDelete}
          title="게시글 삭제"
          description="게시글을 삭제하면 복구할 수 없어요. 정말 삭제하시겠어요?"
          confirmText="삭제하기"
          cancelText="취소"
          type="danger"
        />
      )}
    </div>
  );
}
