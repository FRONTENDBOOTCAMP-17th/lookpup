"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import Pill from "@/components/ui/Pill";
import LoadingPage from "@/components/common/LoadingPage";
import { useUserStore } from "@/store/userStore";
import { splitConditions } from "@/utils/boardConditions";

const CATEGORIES = ["전체", "방문돌봄", "위탁돌봄", "산책", "펫호텔"];

const ITEMS_PER_PAGE = 5;
const PAGE_WINDOW_SIZE = 5;

const REQUEST_TYPE_MAP: Record<string, string> = {
  care: "방문돌봄",
  foster: "위탁돌봄",
  walk: "산책",
  hotel: "펫호텔",
  pickup: "픽업",
  other: "기타",
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
  const sStr = `${s.getMonth() + 1}월 ${s.getDate()}일`;
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  if (sameDay) return `${sStr} (당일)`;
  return `${sStr} - ${e.getMonth() + 1}월 ${e.getDate()}일`;
}

function formatRelativeTime(dateStr: string) {
  const diffH = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 3600000,
  );
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <Link href={`/board/${post.id}`}>
      <div
        style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
        className="animate-list-fade-in p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex justify-between items-start cursor-pointer hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0px_8px_24px_0px_rgba(232,116,42,0.15)] transition-all duration-200"
      >
        <div className="flex-1 flex flex-col gap-2 min-w-0 pr-6">
          <div className="flex items-center gap-3">
            <Pill className="shrink-0">{post.category}</Pill>
            <span className="text-stone-900 text-lg font-semibold truncate">
              {post.title}
            </span>
          </div>

          <p className="text-gray-500 text-base leading-6 line-clamp-1">
            {post.desc}
          </p>

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

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-gray-400 text-xs">{post.createdAt}</span>
          <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
        </div>
      </div>
    </Link>
  );
}

export default function BoardListClient() {
  const { isLoggedIn } = useUserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(() => {
    const cat = searchParams.get("category");
    return cat && CATEGORIES.includes(cat) ? cat : "전체";
  });

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "전체") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    const qs = params.toString();
    router.replace(`/board${qs ? `?${qs}` : ""}`, { scroll: false });
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests?status=open")
      .then((res) => res.json())
      .then((result) => {
        if ("data" in result && Array.isArray(result.data)) {
          setPosts(
            result.data.map((r: RequestRow) => ({
              id: r.id,
              category: REQUEST_TYPE_MAP[r.request_type] ?? r.request_type,
              title: r.title,
              desc: splitConditions(r.content ?? "").content,
              location: r.location,
              period: formatPeriod(r.start_datetime, r.end_datetime),
              price: r.budget
                ? r.budget.toLocaleString("ko-KR") + "원"
                : "협의 가능",
              createdAt: formatRelativeTime(r.created_at),
            })),
          );
        }
      })
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const filtered = posts.filter((p) => {
    const matchCategory =
      activeCategory === "전체" || p.category === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      p.title.includes(searchQuery) ||
      p.desc.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  let windowStart = Math.max(1, safePage - Math.floor(PAGE_WINDOW_SIZE / 2));
  const windowEnd = Math.min(totalPages, windowStart + PAGE_WINDOW_SIZE - 1);
  windowStart = Math.max(1, windowEnd - PAGE_WINDOW_SIZE + 1);
  const pageNumbers = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-orange-50">
        {postsLoading ? (
          <LoadingPage fullScreen />
        ) : (
          <div className="animate-list-fade-in max-w-[1280px] mx-auto px-4 sm:px-10 py-8 md:py-12">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-stone-900">
                  구인게시판
                </h1>
                <p className="text-gray-500 text-base mt-2">
                  펫시터를 찾거나 구인 정보를 확인하세요
                </p>
              </div>
              <Link
                href="/board/write"
                onClick={(e) => {
                  if (!isLoggedIn) {
                    e.preventDefault();
                    router.push("/auth/login");
                  }
                }}
                className="h-12 px-6 bg-orange-500 text-white text-base font-semibold rounded-[10px] flex items-center transition-all hover:bg-orange-600"
              >
                글쓰기
              </Link>
            </div>

            <div className="p-4 md:p-6 bg-white rounded-2xl shadow-sm mb-6">
              <SearchFilterBar
                placeholder="제목, 내용으로 검색"
                filters={CATEGORIES}
                activeFilter={activeCategory}
                onFilterChange={handleCategoryChange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                className="[&>div:first-child>div:last-child]:hidden"
              />
            </div>

            <div className="mb-4">
              <span className="text-gray-500 text-sm">
                총 {filtered.length}개의 구인글
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {paginated.length > 0 ? (
                paginated.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))
              ) : (
                <div className="py-20 text-center text-gray-400 text-base bg-white rounded-2xl border border-orange-100">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="이전 페이지"
                  className="w-10 h-10 rounded-lg bg-white text-gray-500 hover:bg-orange-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-10 h-10 rounded-lg text-base font-medium transition-colors ${
                      n === safePage
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-500 hover:bg-orange-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                  aria-label="다음 페이지"
                  className="w-10 h-10 rounded-lg bg-white text-gray-500 hover:bg-orange-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
