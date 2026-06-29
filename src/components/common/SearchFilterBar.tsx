"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

interface SearchFilterBarProps {
  placeholder?: string;
  filters: readonly string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  className?: string;
  sortOptions?: readonly string[];
  sortBy?: string | null;
  onSortChange?: (sort: string) => void;
  hideSearch?: boolean;
  hideSort?: boolean;
  rightAction?: ReactNode;
}

/**
 * 검색 입력창 + 필터 버튼 + 필터 탭을 묶은 공통 바.
 * 펫시터 찾기 / 구인게시판
 */
export default function SearchFilterBar({
  placeholder = "검색",
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  className = "",
  sortOptions,
  sortBy,
  onSortChange,
  hideSearch = false,
  hideSort = false,
  rightAction,
}: SearchFilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* 검색 입력창 + 필터 버튼 */}
      {(!hideSearch || !hideSort) && <div className="flex gap-2 md:gap-3">
        {!hideSearch && (
          <div className="flex-1 flex items-center gap-2 px-3 md:px-4 py-3 bg-orange-50 rounded-xl min-w-0">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm md:text-base text-stone-900 placeholder:text-stone-900/50 outline-none"
            />
          </div>
        )}

        {/* 정렬 버튼 or 커스텀 액션 */}
        {!hideSort && (rightAction ? (
          <div className="shrink-0 ml-auto">{rightAction}</div>
        ) : (
          <div ref={sortRef} className="relative shrink-0 ml-auto">
            <button
              onClick={() => sortOptions && setIsSortOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${
                sortBy
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-stone-900 hover:bg-orange-100"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm hidden sm:inline">필터</span>
            </button>

            {isSortOpen && sortOptions && (
              <ul className="absolute right-0 mt-2 w-36 bg-white border border-orange-100 rounded-xl shadow-lg z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <li key={option}>
                    <button
                      onClick={() => {
                        onSortChange?.(option);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 ${
                        sortBy === option
                          ? "text-orange-500 font-semibold bg-orange-50"
                          : "text-stone-700"
                      }`}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>}

      {/* 필터 탭 */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === f
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-gray-500 hover:bg-orange-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
