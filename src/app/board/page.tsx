"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, DollarSign, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchFilterBar from "@/components/common/SearchFilterBar";

// 더미데이터 꼬라박기

const CATEGORIES = ["전체", "방문돌봄", "위탁돌봄", "산책", "펫호텔", "픽업"];

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

function PostCard({ post }: { post: (typeof POSTS)[0] }) {
  return (
    <Link href={`/board/${post.id}`}>
      <div className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex justify-between items-start cursor-pointer hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0px_8px_24px_0px_rgba(232,116,42,0.15)] transition-all duration-200">
        {/* 왼쪽 콘텐츠 */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 pr-6">
          {/* 카테고리 + 제목 */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-xs font-medium">
              {post.category}
            </span>
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
          <span className="text-gray-400 text-xs">조회 {post.views}</span>
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

  const filtered = POSTS.filter((p) => {
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
            />
          </div>

          {/* 목록 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">
              총 {filtered.length}개의 구인글
            </span>
            <select className="h-9 px-3 bg-white border border-orange-100 rounded-lg text-sm text-stone-900 outline-none cursor-pointer hover:border-orange-300 transition-colors">
              <option>최신순</option>
              <option>조회순</option>
            </select>
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
