"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionCard from "@/components/common/SectionCard";

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
  /** [텍스트] 형태로 감싼 단어를 링크로 변환하는 맵 */
  linkMap?: Record<string, string>;
};

function renderWithLinks(text: string, linkMap?: Record<string, string>): ReactNode {
  if (!linkMap) return text;
  const match = text.match(/^([\s\S]*?)\[([^\]]+)\]([\s\S]*)$/);
  if (match && linkMap[match[2]]) {
    return (
      <>
        {match[1]}
        <Link
          href={linkMap[match[2]]}
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

export default function LegalPage({
  title,
  subtitle,
  heading,
  intro,
  articles,
  effectiveDate,
  linkMap,
}: LegalPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-orange-100">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-stone-900" />
          </button>
          <span className="flex-1 font-semibold text-stone-900">{title}</span>
        </div>
      </div>

      <div className="w-full max-w-200 mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-16">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 소개 + 조항 전체 박스 */}
          <SectionCard className="p-6 gap-6">
            {/* 소개 */}
            <div>
              <h1 className="text-xl font-bold text-stone-900 mb-4">{heading}</h1>
              {intro}
            </div>

            {/* 조항 목록 */}
            {articles.map((article, index) => (
              <div key={article.title}>
                {index > 0 && <div className="border-t border-orange-100 mb-6" />}
                <h2 className="text-base font-bold text-[var(--color-orange-500)] mb-3">
                  {article.title}
                </h2>
                {article.content ? (
                  <div className="flex flex-col gap-2">
                    {article.content.map((text, i) => (
                      <p
                        key={i}
                        className="text-sm text-stone-900 leading-relaxed"
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
                          <p className="text-sm text-stone-900 leading-relaxed">
                            <span className="font-semibold">{item.title}</span>
                            <br />
                            {item.text}
                          </p>
                        ) : (
                          <p className="text-sm text-stone-900 leading-relaxed whitespace-pre-line">
                            {renderWithLinks(item, linkMap)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </SectionCard>

          {/* 적용일자 */}
          <div className="bg-orange-50 rounded-2xl border border-orange-100 px-6 py-4">
            <p className="text-sm font-semibold text-[var(--color-orange-500)]">
              적용일자
            </p>
            <p className="text-sm text-gray-500 mt-1">{effectiveDate}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
