"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  searchAreaList,
  searchPlaceList,
  type LocationSuggestion,
} from "@/utils/kakaoGeocode";

interface UseAreaSearchOptions {
  areaLabel: string;
  onLocationSelected: (lat: number, lng: number, label: string) => void;
  onClear: () => void;
}

export function useAreaSearch({
  areaLabel,
  onLocationSelected,
  onClear,
}: UseAreaSearchOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [areaQuery, setAreaQuery] = useState(areaLabel);
  const [areaSuggestions, setAreaSuggestions] = useState<LocationSuggestion[]>([]);
  const areaSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);
  const skipSyncRef = useRef(false);

  const trimmedAreaQuery = areaQuery.trim();
  const isSuggestionQueryValid = trimmedAreaQuery.length >= 2 && trimmedAreaQuery !== areaLabel;
  const showSuggestions = isSuggestionQueryValid && areaSuggestions.length > 0;

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setAreaQuery(areaLabel);
  }, [areaLabel]);

  useEffect(() => {
    if (!isSuggestionQueryValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      const [areaResults, placeResults] = await Promise.all([
        searchAreaList(trimmedAreaQuery),
        searchPlaceList(trimmedAreaQuery),
      ]);
      setAreaSuggestions([...areaResults, ...placeResults]);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedAreaQuery, isSuggestionQueryValid]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (areaSearchRef.current && !areaSearchRef.current.contains(e.target as Node)) {
        setAreaSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pushAreaParams(district: string, dong: string, city = "") {
    const params = new URLSearchParams(searchParams.toString());
    if (city) params.set("city", city);
    else params.delete("city");
    if (district) params.set("district", district);
    else params.delete("district");
    if (dong) params.set("dong", dong);
    else params.delete("dong");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAreaFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    params.delete("district");
    params.delete("dong");
    params.delete("selected");
    params.delete("sel_city");
    params.delete("sel_district");
    params.delete("sel_dong");
    router.push(`${pathname}?${params.toString()}`);
    setAreaQuery("");
    onClear();
  }

  function selectAreaSuggestion(suggestion: LocationSuggestion) {
    justSelectedRef.current = true;
    setAreaSuggestions([]);
    setAreaQuery(suggestion.label);
    onLocationSelected(suggestion.lat, suggestion.lng, suggestion.label);
    if (suggestion.type === "area") {
      pushAreaParams(suggestion.district, suggestion.dong, suggestion.city);
    } else {
      skipSyncRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("city");
      params.delete("district");
      params.delete("dong");
      router.push(`${pathname}?${params.toString()}`);
    }
  }

  return {
    areaQuery,
    setAreaQuery,
    areaSuggestions,
    showSuggestions,
    areaSearchRef,
    selectAreaSuggestion,
    clearAreaFilter,
  };
}
