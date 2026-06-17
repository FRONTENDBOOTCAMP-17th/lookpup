"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Calendar, DollarSign, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import Pill from "@/components/ui/Pill";

const CATEGORIES = ["전체", "방문돌봄", "위탁돌봄", "산책", "펫호텔", "픽업"];

const SORT_OPTIONS = ["최신순"] as const;

const REQUEST_TYPE_MAP: Record<string, string> = {
  care: "방문돌봄",
  foster: "위탁돌봄",
  walk: "산책",
  hotel: "펫호텔",
  pickup: "픽업",
};

type Post = {
  id: string;
  category: string;
  title: string;
  desc: string;
  location: string;
  period: string;
  price: string;
  createdAt: string;
};

// GET /api/requests?status=open 응답 행 (필요한 필드만)
type RequestRow = {
  id: string;
  request_type: string;
  title: string;
  content: string | null;
  location: string;
  start_datetime: string;
  end_datetime: string;
  budget: number;
  created_at: string;
};

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getMonth() + 1}월 ${s.getDate()}일 - ${e.getMonth() + 1}월 ${e.getDate()}일`;
}

function formatRelativeTime(dateStr: string) {
  const diffH = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 3600000,
  );
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

const POSTS = [
  {
    id: 1,
    category: "방문돌봄",
    title: "포메라니안 방문돌봄 구합니다",
    desc: "3살 포메라니안 뭉치의 방문돌봄을 부탁드립니다. 하루 2회 방문 필요합니다.",
    location: "서울 마포구",
    period: "6월 15일 - 6월 17일",
    price: "30,000원/일",
    createdAt: "2시간 전",
    views: 45,
  },
  {
    id: 2,
    category: "위탁돌봄",
    title: "고양이 위탁돌봄 급구!",
    desc: "러시안블루 나비 1주일 위탁돌봄 급하게 구합니다. 경험 많으신 분 환영합니다.",
    location: "서울 강남구",
    period: "6월 20일 - 6월 27일",
    price: "40,000원/일",
    createdAt: "5시간 전",
    views: 128,
  },
  {
    id: 3,
    category: "산책",
    title: "대형견 산책 도와주실 분",
    desc: "골든 리트리버 산책 도와주실 분을 찾습니다. 주 3회, 1시간씩입니다.",
    location: "서울 용산구",
    period: "정기 (월/수/금)",
    price: "20,000원/회",
    createdAt: "1일 전",
    views: 82,
  },
  {
    id: 4,
    category: "펫호텔",
    title: "여행 기간 중 펫호텔 추천해주세요",
    desc: "2주 해외여행 동안 믿고 맡길 수 있는 펫호텔을 찾고 있습니다.",
    location: "서울 송파구",
    period: "7월 1일 - 7월 14일",
    price: "협의 가능",
    createdAt: "1일 전",
    views: 156,
  },
  {
    id: 5,
    category: "방문돌봄",
    title: "노견 케어 경험 있는 펫시터",
    desc: "12살 슈나우저 케어 가능한 펫시터를 찾습니다. 약 복용 도움 필요합니다.",
    location: "서울 성동구",
    period: "6월 18일 - 6월 21일",
    price: "50,000원/일",
    createdAt: "2일 전",
    views: 67,
  },
];

// 게시글 카드

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/board/${post.id}`}>
      <div className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex justify-between items-start cursor-pointer hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0px_8px_24px_0px_rgba(232,116,42,0.15)] transition-all duration-200">
        {/* 왼쪽 콘텐츠 */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 pr-6">
          {/* 카테고리 + 제목 */}
          <div className="flex items-center gap-3">
            <Pill className="shrink-0">{post.category}</Pill>
            <span className="text-stone-900 text-lg font-semibold truncate">
              {post.title}
            </span>
          </div>

          {/* 내용 */}
          <p className="text-gray-500 text-base leading-6 line-clamp-1">
            {post.desc}
          </p>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 text-sm">{post.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 text-sm">{post.period}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-orange-500 text-sm font-semibold">
                {post.price}
              </span>
            </div>
          </div>
        </div>

        {/* 오른쪽 메타 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-gray-400 text-xs">{post.createdAt}</span>
          <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
        </div>
      </div>
    </Link>
  );
}

//페이지

export default function BoardPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>(POSTS as unknown as Post[]);
  // 실제 데이터로 교체 시 아래 useState로 변경 위는 더미 데이터 표시용
  // const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/requests?status=open")
      .then((res) => res.json())
      .then((result) => {
        // data.length > 0 조건: DB에 데이터 없으면 더미 유지
        if ("data" in result && result.data && result.data.length > 0) {
          setPosts(
            result.data.map((r: RequestRow) => ({
              id: r.id,
              category: REQUEST_TYPE_MAP[r.request_type] ?? r.request_type,
              title: r.title,
              desc: r.content ?? "",
              location: r.location,
              period: formatPeriod(r.start_datetime, r.end_datetime),
              price: r.budget
                ? r.budget.toLocaleString("ko-KR") + "원"
                : "협의 가능",
              createdAt: formatRelativeTime(r.created_at),
            })),
          );
        }
      });
  }, []);

  const filtered = posts.filter((p) => {
    const matchCategory =
      activeCategory === "전체" || p.category === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      p.title.includes(searchQuery) ||
      p.desc.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-orange-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">구인게시판</h1>
              <p className="text-gray-500 text-base mt-2">
                펫시터를 찾거나 구인 정보를 확인하세요
              </p>
            </div>
            <Link
              href="/board/write"
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-[10px] flex items-center transition-colors"
            >
              글쓰기
            </Link>
          </div>

          {/* 검색 + 필터 */}
          <div className="p-4 md:p-6 bg-white rounded-2xl shadow-sm mb-6">
            <SearchFilterBar
              placeholder="제목, 내용으로 검색"
              filters={CATEGORIES}
              activeFilter={activeCategory}
              onFilterChange={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOptions={SORT_OPTIONS}
            />
          </div>

          {/* 목록 헤더 */}
          <div className="mb-4">
            <span className="text-gray-500 text-sm">
              총 {filtered.length}개의 구인글
            </span>
          </div>

          {/* 게시글 목록 */}
          <div className="flex flex-col gap-3">
            {filtered.length > 0 ? (
              filtered.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="py-20 text-center text-gray-400 text-base bg-white rounded-2xl border border-orange-100">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`w-10 h-10 rounded-lg text-base font-medium transition-colors ${
                  n === 1
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-500 hover:bg-orange-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
