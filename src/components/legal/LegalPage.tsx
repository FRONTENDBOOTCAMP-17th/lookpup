"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export type TitledItem = { title: string; text: string };
export type ArticleItem = string | TitledItem;

export type LegalArticle = {
  title: string;
  content?: string[];
  items?: ArticleItem[];
};

function isTitledItem(item: ArticleItem): item is TitledItem {
  return typeof item === "object" && "title" in item;
}

function renderItemText(
  text: string,
  links: Record<string, string> | undefined,
) {
  if (!links) return text;
  const match = text.match(/^([\s\S]*?)\[([^\]]+)\]([\s\S]*)$/);
  if (match && links[match[2]]) {
    return (
      <>
        {match[1]}
        <Link
          href={links[match[2]]}
          className="text-[var(--color-orange-500)] underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          {match[2]}
        </Link>
        {match[3]}
      </>
    );
  }
  return text;
}

type LegalPageProps = {
  /** 모바일 헤더 · 데스크탑 타이틀에 쓰이는 문서 이름 (예: "이용약관") */
  title: string;
  /** 데스크탑 타이틀 아래 부제 */
  subtitle: string;
  /** 흰색 박스 상단 제목 (예: "봐주개 이용약관") */
  heading: string;
  /** 흰색 박스 상단 소개 문단 */
  intro: ReactNode;
  articles: LegalArticle[];
  /** 적용일자 박스 문장 */
  effectiveDate: string;
  /** 문자열 항목 텍스트의 "[키워드]" 부분을 링크로 치환하기 위한 키워드→href 맵. 미지정 시 그대로 출력 */
  itemLinks?: Record<string, string>;
};

export default function LegalPage({
  title,
  subtitle,
  heading,
  intro,
  articles,
  effectiveDate,
  itemLinks,
}: LegalPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">{title}</span>
        </div>
      </div>

      <div className="w-full max-w-200 mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-16">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">{title}</h2>
            <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 소개 + 조항 전체 박스 */}
          <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-6 flex flex-col gap-6">
            {/* 소개 */}
            <div>
              <h1 className="text-xl font-bold text-[#281A0E] mb-4">
                {heading}
              </h1>
              {intro}
            </div>

            {/* 조항 목록 */}
            {articles.map((article, index) => (
              <div key={article.title}>
                {index > 0 && (
                  <div className="border-t border-[#FFE9D6] mb-6" />
                )}
                <h2 className="text-base font-bold text-[var(--color-orange-500)] mb-3">
                  {article.title}
                </h2>
                {article.content ? (
                  <div className="flex flex-col gap-2">
                    {article.content.map((text, i) => (
                      <p
                        key={i}
                        className="text-sm text-[#281A0E] leading-relaxed"
                      >
                        {text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {article.items?.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-sm font-semibold text-[var(--color-orange-500)] leading-relaxed shrink-0">
                          {i + 1}.
                        </span>
                        {isTitledItem(item) ? (
                          <p className="text-sm text-[#281A0E] leading-relaxed">
                            <span className="font-semibold">{item.title}</span>
                            <br />
                            {item.text}
                          </p>
                        ) : (
                          <p className="text-sm text-[#281A0E] leading-relaxed whitespace-pre-line">
                            {renderItemText(item, itemLinks)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>

          {/* 적용일자 */}
          <div className="bg-[#FFF0E8] rounded-2xl border border-[#FFE9D6] px-6 py-4">
            <p className="text-sm font-semibold text-[var(--color-orange-500)]">
              적용일자
            </p>
            <p className="text-sm text-[#6B7280] mt-1">{effectiveDate}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
