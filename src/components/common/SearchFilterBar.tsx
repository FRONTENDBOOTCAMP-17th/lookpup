"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SearchFilterBarProps {
  placeholder?: string;
  filters: readonly string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export default function SearchFilterBar({
  placeholder = "검색",
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  className = "",
}: SearchFilterBarProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex gap-2 md:gap-3">
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
        <button className="shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-3 bg-orange-50 rounded-xl text-stone-900 font-medium hover:bg-orange-100 transition-colors">
          <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm hidden sm:inline">필터</span>
        </button>
      </div>

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
