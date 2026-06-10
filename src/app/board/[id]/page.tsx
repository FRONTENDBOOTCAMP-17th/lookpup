"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Send,
  Star,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// 더미 데이터 : 뭘눌러도 이것만 나와요 우하하~~~

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
  const router = useRouter();
  const [comment, setComment] = useState("");

  return (
    <>
      <Header />

      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* 왼쪽 메인 콘텐츠 */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* 목록으로 */}
              <Link
                href="/board"
                className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors w-fit"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-base">목록으로</span>
              </Link>

              {/* 게시글 헤더 카드 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 overflow-hidden">
                {/* 썸네일 */}
                <div className="h-64 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                  <span className="text-7xl opacity-30">🐾</span>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  {/* 상태 + 메타 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-xs font-medium rounded-full">
                      {POST.status}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4 text-gray-500 text-sm">
                      <span>{POST.createdAt}</span>
                      <span>조회 {POST.views}</span>
                      <span>지원 {POST.applicants}명</span>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
                    {POST.title}
                  </h1>

                  {/* 상세 정보 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">위치</p>
                        <p className="text-stone-900 text-base font-medium">
                          {POST.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">기간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {POST.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">시간</p>
                        <p className="text-stone-900 text-base font-medium">
                          {POST.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">급여</p>
                        <p className="text-orange-500 text-base font-medium">
                          {POST.price}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {POST.priceNote}
                        </p>
                      </div>
                    </div>
                    {/* 지원하기 버튼 */}
                    <div className="flex gap-3 sm:col-span-2">
                      <button
                        onClick={() => router.push("/chat")}
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-orange-500 rounded-[10px] text-white text-base font-medium hover:bg-orange-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        지원하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 내용 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4">
                <h2 className="text-stone-900 text-xl font-bold">상세 내용</h2>
                <p className="text-stone-900 text-base leading-7 whitespace-pre-line">
                  {POST.description}
                </p>
              </div>

              {/* 요구사항 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4">
                <h2 className="text-stone-900 text-xl font-bold">요구사항</h2>
                <ul className="flex flex-col gap-3">
                  {POST.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2.5 shrink-0" />
                      <span className="text-stone-900 text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 댓글 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4">
                <h2 className="text-stone-900 text-xl font-bold">
                  댓글 {COMMENTS.length}
                </h2>

                {/* 댓글 입력 */}
                <div className="flex items-start gap-3 pb-6 border-b border-orange-100">
                  <div className="w-10 h-10 bg-orange-50 rounded-full border-2 border-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-base font-semibold">
                      나
                    </span>
                  </div>
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
                      <div className="w-10 h-10 bg-orange-50 rounded-full border-2 border-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-500 text-base font-semibold">
                          {c.initial}
                        </span>
                      </div>
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
              </div>
            </div>

            {/* 오른쪽 사이드바 */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6 lg:sticky lg:top-20">
              {/* 작성자 정보 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4">
                <h3 className="text-stone-900 text-lg font-bold">
                  작성자 정보
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-orange-50 rounded-full border-2 border-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-xl font-semibold">
                      {POST.author.initial}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-stone-900 text-base font-semibold">
                        {POST.author.name}
                      </span>
                      {POST.author.verified && (
                        <span className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-medium">
                          인증
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500 text-sm">
                        {POST.author.district}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-stone-900 text-sm font-bold">
                          {POST.author.rating}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({POST.author.reviews})
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        가입 {POST.author.joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 작성자의 다른 글 */}
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-stone-900 text-lg font-bold">
                    {POST.author.name}님의 다른 게시물
                  </h3>
                  <Link
                    href="/board"
                    className="text-orange-500 text-xs font-medium hover:underline"
                  >
                    더보기
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {SIMILAR_POSTS.map((p) => (
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
