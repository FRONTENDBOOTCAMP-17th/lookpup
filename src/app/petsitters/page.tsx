"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, Star, LocateFixed, ChevronRight, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import KakaoMap from "@/components/KakaoMap";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import { calculateDistanceKm, formatDistance } from "@/utils/distance";
import {
  coordToRegion,
  searchAreaList,
  searchPlaceList,
  searchAddressToCoord,
  searchPlaceToCoord,
  type LocationSuggestion,
} from "@/utils/kakaoGeocode";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";
import { getOwnerLocation } from "@/app/actions/users";

const FILTERS = ["전체", "방문돌봄", "위탁돌봄", "산책"] as const;
type Filter = (typeof FILTERS)[number];

const SERVICE_TYPE_MAP: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

interface Sitter {
  id: string;
  user_id: string | null;
  name: string;
  initial: string;
  city: string;
  district: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  price: number;
  services: string[];
  lat: number;
  lng: number;
}

const CITY_SUFFIXES = ["특별시", "광역시", "특별자치시", "특별자치도"];
function isCityToken(s: string) {
  return s === "서울" || CITY_SUFFIXES.some((sfx) => s.endsWith(sfx));
}

function parseArea(area: string | null): {
  city: string;
  district: string;
  neighborhood: string;
} {
  if (!area) return { city: "", district: "", neighborhood: "" };
  const parts = area.replace(/,.*$/, "").trim().split(/\s+/);
  if (parts.length >= 3 && isCityToken(parts[0])) {
    return { city: parts[0], district: parts[1], neighborhood: parts[2] };
  }
  if (parts.length >= 2 && isCityToken(parts[0])) {
    return { city: parts[0], district: parts[1], neighborhood: "" };
  }
  return { city: "", district: parts[0] ?? "", neighborhood: parts[1] ?? "" };
}

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

interface PetsitterCardProps {
  sitter: Sitter;
  isSelected: boolean;
  distance: number;
  onClick: () => void;
  onConfirm: () => void;
}

function PetsitterCard({
  sitter,
  isSelected,
  distance,
  onClick,
  onConfirm,
}: PetsitterCardProps) {
  return (
    <div onClick={isSelected ? onConfirm : onClick} className="block">
      <div
        className={`w-full p-5 bg-white rounded-2xl border flex flex-col gap-0 transition-all cursor-pointer ${
          isSelected
            ? "border-orange-400 shadow-[0px_4px_20px_0px_rgba(232,116,42,0.28)] ring-2 ring-orange-400"
            : "border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] hover:shadow-[0px_4px_16px_0px_rgba(232,116,42,0.18)]"
        }`}
      >
        <div className="flex items-start gap-4">
          <Avatar initial={sitter.initial} size="lg" variant="orange" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-stone-900 text-base font-semibold">
                {sitter.name}
              </span>
              {isSelected && (
                <span className="flex items-center gap-0.5 text-orange-500 text-sm font-semibold">
                  예약하기 <ChevronRight size={15} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500 text-sm">
                {sitter.district} {sitter.neighborhood}
              </span>
              <span className="text-gray-400 text-xs">
                · {formatDistance(distance)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {sitter.services.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-stone-900 text-base font-bold">
              {sitter.rating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">
              ({sitter.reviewCount})
            </span>
          </div>
          <span className="text-orange-500 text-base font-semibold">
            {sitter.price.toLocaleString()}원~
          </span>
        </div>
      </div>
    </div>
  );
}

function PetsittersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlDistrict = searchParams.get("district") ?? "";
  const urlDong = searchParams.get("dong") ?? "";
  const urlCity = searchParams.get("city") ?? "";
  const urlSelected = searchParams.get("selected") ?? "";

  const areaLabel = [urlCity, urlDistrict, urlDong].filter(Boolean).join(" ");
  const hasAreaFilter = !!(urlDistrict || urlDong);

  // ── 지역 검색 자동완성 상태 ──────────────────────────────────
  const [areaQuery, setAreaQuery] = useState(areaLabel);
  const [areaSuggestions, setAreaSuggestions] = useState<LocationSuggestion[]>(
    [],
  );
  const areaSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 항목 선택 직후 debounce 재실행으로 드롭다운이 다시 열리는 것을 방지
  const justSelectedRef = useRef(false);
  // 장소 선택으로 URL 파라미터를 직접 제거할 때 입력창 동기화 스킵
  const skipSyncRef = useRef(false);

  // showSuggestions는 state가 아니라 파생값으로 처리
  const trimmedAreaQuery = areaQuery.trim();
  const isSuggestionQueryValid =
    trimmedAreaQuery.length >= 2 && trimmedAreaQuery !== areaLabel;
  const showSuggestions = isSuggestionQueryValid && areaSuggestions.length > 0;

  // 뒤로가기/앞으로가기로 URL이 바뀌면 입력창도 동기화
  // 단, 장소 선택으로 직접 파라미터를 제거한 경우는 스킵
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setAreaQuery(areaLabel);
  }, [areaLabel]);

  // 입력값이 유효할 때만 자동완성 API 호출 (300ms debounce)
  useEffect(() => {
    if (!isSuggestionQueryValid) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      // 지역(구/동)과 장소(역, 대학교 등) 동시 검색
      const [areaResults, placeResults] = await Promise.all([
        searchAreaList(trimmedAreaQuery),
        searchPlaceList(trimmedAreaQuery),
      ]);
      // 지역 결과 우선, 장소 결과 뒤에
      const combined: LocationSuggestion[] = [...areaResults, ...placeResults];
      setAreaSuggestions(combined);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedAreaQuery, isSuggestionQueryValid]);

  // 드롭다운 외부 클릭 시 닫기 (areaSuggestions를 비워서 파생값 showSuggestions가 false가 됨)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        areaSearchRef.current &&
        !areaSearchRef.current.contains(e.target as Node)
      ) {
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
    setSelectedSitterId(null);
  }

  function selectAreaSuggestion(suggestion: LocationSuggestion) {
    justSelectedRef.current = true;
    setAreaSuggestions([]);
    setAreaQuery(suggestion.label);
    setBasePosition({ lat: suggestion.lat, lng: suggestion.lng });
    setBaseLabel(suggestion.label);

    if (suggestion.type === "area") {
      pushAreaParams(suggestion.district, suggestion.dong, suggestion.city);
    } else {
      // 장소 선택 → URL 지역 파라미터만 제거 (입력창은 유지)
      skipSyncRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("city");
      params.delete("district");
      params.delete("dong");
      router.push(`${pathname}?${params.toString()}`);
    }
  }

  // ── 시터 목록 ────────────────────────────────────────────────
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("전체");
  const [selectedSitterId, setSelectedSitterId] = useState<string | null>(
    urlSelected || null,
  );

  // ── 위치(거리 계산용) ─────────────────────────────────────────
  const [basePosition, setBasePosition] = useState(DEFAULT_CENTER);
  const [baseLabel, setBaseLabel] = useState("강남역");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  async function requestLocationSilently() {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저는 위치 서비스를 지원하지 않아요.");
      return;
    }

    if (navigator.permissions) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "denied") {
        const { data: saved } = await getOwnerLocation();
        if (saved) {
          setBasePosition({ lat: saved.lat, lng: saved.lng });
          setBaseLabel(`저장된 위치 (${saved.dong || saved.address})`);
          return;
        }
        setLocationError(
          "브라우저 위치 권한이 차단되어 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.",
        );
        return;
      }
    }

    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setBasePosition(pos);
        setBaseLabel("현재 위치");
        const region = await coordToRegion(pos.lat, pos.lng);
        if (region) {
          setBaseLabel(`현재 위치 (${region.dong || region.sigungu})`);
        }
        setLocationLoading(false);
      },
      async (err) => {
        setLocationLoading(false);
        const { data: saved } = await getOwnerLocation();
        if (saved) {
          setBasePosition({ lat: saved.lat, lng: saved.lng });
          setBaseLabel(`저장된 위치 (${saved.dong || saved.address})`);
          return;
        }
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "브라우저 위치 권한이 차단되어 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.",
          );
        } else {
          setLocationError(
            "위치를 가져올 수 없어요. 강남역 기준으로 표시됩니다.",
          );
        }
      },
      { timeout: 10000 },
    );
  }

  // URL에 지역 파라미터가 있을 때 지도를 해당 위치로 초기화
  // Kakao SDK 로드 완료 후 실행 (타이밍 문제 방지)
  useEffect(() => {
    if (!urlDistrict) return;
    const query = [urlCity, urlDistrict, urlDong].filter(Boolean).join(" ");

    async function run() {
      const result =
        (await searchAddressToCoord(query)) ??
        (await searchPlaceToCoord(query));
      if (result) setBasePosition({ lat: result.lat, lng: result.lng });
    }

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(run);
    } else {
      const id = setInterval(() => {
        if (window.kakao?.maps?.load) {
          clearInterval(id);
          window.kakao.maps.load(run);
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, [urlCity, urlDistrict, urlDong]);

  // URL 지역 파라미터 변경 시 DB에서 필터링된 데이터 조회
  useEffect(() => {
    type SitterRow = {
      id: string;
      user_id?: string | null;
      available_area: string | null;
      display_area: string | null;
      latitude: number | null;
      longitude: number | null;
      base_price: number | null;
      rating: number | null;
      full_name: string | null;
      service_types: string[];
    };

    async function fetchSitters() {
      const { data, error } = await supabase.rpc("get_petsitters_filtered", {
        p_district: urlDistrict || null,
        p_dong: urlDong || null,
      });

      if (error || !data) return;

      const mapped: Sitter[] = (data as SitterRow[])
        .filter((row) => row.latitude != null && row.longitude != null)
        .map((row) => {
          const name = row.full_name ?? "시터";
          const { city, district, neighborhood } = parseArea(
            row.available_area,
          );
          const serviceTypes = row.service_types
            .map((t) => SERVICE_TYPE_MAP[t] ?? t)
            .filter(Boolean);

          return {
            id: row.id,
            user_id: row.user_id ?? null,
            name,
            initial: name.charAt(0),
            city,
            district,
            neighborhood,
            rating: parseFloat(String(row.rating ?? 0)),
            reviewCount: 0,
            price: row.base_price ?? 0,
            services: [...new Set(serviceTypes)],
            lat: parseFloat(String(row.latitude)),
            lng: parseFloat(String(row.longitude)),
          };
        });

      setSitters(mapped);
    }

    fetchSitters();
  }, [urlDistrict, urlDong]);

  // 위치 동의 여부 확인
  useEffect(() => {
    const browserClient = createClient();

    async function checkLocationConsent() {
      const {
        data: { user },
      } = await browserClient.auth.getUser();

      if (!user) {
        if (!urlDistrict) {
          const localConsent = localStorage.getItem("location_consent");
          if (localConsent !== "true") {
            setShowLocationModal(true);
          } else {
            requestLocationSilently();
          }
        }
        return;
      }

      setCurrentUserId(user.id);

      const { data } = await browserClient
        .from("users")
        .select("location_consent")
        .eq("id", user.id)
        .single();

      if (data?.location_consent) {
        if (!urlDistrict) requestLocationSilently();
      } else {
        if (!urlDistrict) setShowLocationModal(true);
      }
    }

    checkLocationConsent();
  }, []);

  // selectedSitterId 변경 시 URL에 선택 위치 반영 (검색 파라미터 건드리지 않음)
  useEffect(() => {
    if (!selectedSitterId) return;
    const sitter = sitters.find((s) => s.id === selectedSitterId);
    if (!sitter) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", selectedSitterId);
    if (sitter.city) params.set("sel_city", sitter.city);
    else params.delete("sel_city");
    if (sitter.district) params.set("sel_district", sitter.district);
    else params.delete("sel_district");
    if (sitter.neighborhood) params.set("sel_dong", sitter.neighborhood);
    else params.delete("sel_dong");
    router.replace(`${pathname}?${params.toString()}`);
    // searchParams는 의도적으로 제외 — 선택 변경 시에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSitterId]);

  // 카드 스크롤 동기화
  useEffect(() => {
    if (selectedSitterId === null) return;
    const card = cardRefs.current.get(selectedSitterId);
    if (!card) return;

    const viewport = card.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    viewport.scrollTo({
      top: viewport.scrollTop + cardRect.top - viewportRect.top - 20,
      behavior: "smooth",
    });
  }, [selectedSitterId]);

  async function requestLocation() {
    setShowLocationModal(false);

    const browserClient = createClient();
    if (currentUserId) {
      await browserClient
        .from("users")
        .update({ location_consent: true })
        .eq("id", currentUserId);
    } else {
      localStorage.setItem("location_consent", "true");
    }

    requestLocationSilently();
  }

  // 비로그인 시 전체 표시, 로그인 시 본인 펫시터 제외
  const visibleSitters = sitters.filter((sitter) => {
    if (!currentUserId) return true;
    return sitter.user_id !== currentUserId;
  });

  const sittersWithDistance = visibleSitters.map((sitter) => ({
    ...sitter,
    distanceKm: calculateDistanceKm(basePosition, {
      lat: sitter.lat,
      lng: sitter.lng,
    }),
  }));

  const filtered = sittersWithDistance
    .filter((s) => {
      const matchFilter =
        activeFilter === "전체" ? true : s.services.includes(activeFilter);
      // 지역 필터가 없을 때만 입력값으로 이름 검색
      const matchSearch =
        hasAreaFilter || areaQuery === "" || s.name.includes(areaQuery);
      return matchFilter && matchSearch;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const listHeading = hasAreaFilter
    ? `${areaLabel} 펫시터 · ${filtered.length}명`
    : `${baseLabel} 기준 가까운 순 · ${filtered.length}명`;

  return (
    <>
      <Header />

      {/* 위치 동의 모달 */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <LocateFixed size={20} className="text-orange-500" />
              </div>
              <h2 className="text-stone-900 text-lg font-semibold">
                현재 위치 사용
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              현재 위치를 사용하면 가까운 펫시터를 찾을 수 있어요!
              <br />
              위치 정보는 펫시터 거리 계산에만 사용됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
              >
                나중에
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium"
              >
                동의하기
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="bg-orange-50 overflow-hidden h-[calc(100vh-64px)]">
        <div className="flex flex-col md:flex-row h-full">
          {/* 지도 영역 */}
          <div className="h-[40vh] md:h-full md:flex-1 relative overflow-hidden">
            {locationLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow text-sm text-orange-500 font-medium">
                위치 확인 중...
              </div>
            )}
            {locationError && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow text-sm text-red-500 font-medium whitespace-nowrap max-w-[90vw] text-center">
                {locationError}
              </div>
            )}
            <KakaoMap
              markers={filtered.map(
                ({
                  lat,
                  lng,
                  id,
                  name,
                  district,
                  neighborhood,
                  distanceKm,
                }) => ({
                  lat,
                  lng,
                  id,
                  name,
                  district,
                  neighborhood,
                  distanceKm,
                }),
              )}
              center={basePosition}
              basePosition={basePosition}
              level={7}
              selectedMarkerId={selectedSitterId}
              onMarkerClick={(id) => setSelectedSitterId(String(id))}
            />
          </div>

          {/* 리스트 패널 */}
          <div className="flex-1 md:flex-none w-full md:w-[520px] bg-white flex flex-col overflow-hidden">
            <div className="p-4 md:p-5 border-b border-orange-100 shrink-0 flex flex-col gap-3">
              {/* 지역 검색바 + 내 위치 버튼 */}
              <div className="flex gap-2">
                <div ref={areaSearchRef} className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 px-3 md:px-4 py-3 bg-orange-50 rounded-xl">
                    <MapPin size={16} className="text-orange-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="지역 또는 펫시터 이름 검색"
                      value={areaQuery}
                      onChange={(e) => setAreaQuery(e.target.value)}
                      onFocus={() => {}}
                      className="flex-1 min-w-0 bg-transparent text-sm md:text-base text-stone-900 placeholder:text-stone-900/50 outline-none"
                    />
                    {areaQuery && (
                      <button
                        onClick={clearAreaFilter}
                        aria-label="지역 검색 초기화"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* 자동완성 드롭다운 */}
                  {showSuggestions && areaSuggestions.length > 0 && (
                    <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-orange-100 rounded-xl shadow-lg overflow-hidden">
                      {areaSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => selectAreaSuggestion(s)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-orange-50 last:border-0 flex items-center gap-3"
                          >
                            <MapPin
                              size={14}
                              className="text-orange-400 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-stone-900 font-medium truncate">
                                {s.label}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {s.type === "area" ? s.city : s.address}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 내 위치 버튼 */}
                <button
                  onClick={requestLocation}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl bg-orange-50 text-stone-900 hover:bg-orange-100 transition-colors"
                  title="내 위치로 지도 이동"
                >
                  <LocateFixed className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                  <span className="text-sm hidden sm:inline font-medium">
                    내 위치
                  </span>
                </button>
              </div>

              {/* 서비스 필터 탭 */}
              <SearchFilterBar
                filters={FILTERS}
                activeFilter={activeFilter}
                onFilterChange={(f) => setActiveFilter(f as Filter)}
                searchQuery=""
                onSearchChange={() => {}}
                hideSearch
                hideSort
              />

              {/* 선택된 지역 필터 칩 */}
              {hasAreaFilter && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-full px-3 py-1 text-sm font-medium">
                    <MapPin size={12} />
                    <span>{areaLabel}</span>
                    <button
                      onClick={clearAreaFilter}
                      aria-label="지역 필터 초기화"
                      className="ml-0.5 hover:text-orange-800 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 md:p-6">
                <p className="text-stone-900 text-lg font-semibold mb-4">
                  {listHeading}
                </p>
                <div className="flex flex-col gap-4">
                  {filtered.map((sitter) => (
                    <div
                      key={sitter.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(sitter.id, el);
                        else cardRefs.current.delete(sitter.id);
                      }}
                    >
                      <PetsitterCard
                        sitter={sitter}
                        isSelected={selectedSitterId === sitter.id}
                        distance={sitter.distanceKm}
                        onClick={() => setSelectedSitterId(sitter.id)}
                        onConfirm={() =>
                          router.push(`/petsitters/${sitter.id}`)
                        }
                      />
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                      <MapPin size={32} className="text-orange-200" />
                      <p className="text-sm">
                        {hasAreaFilter
                          ? `${areaLabel}에 등록된 펫시터가 없어요`
                          : "조건에 맞는 펫시터가 없어요"}
                      </p>
                      {hasAreaFilter && (
                        <button
                          onClick={clearAreaFilter}
                          className="mt-1 text-orange-500 text-sm font-medium underline underline-offset-2"
                        >
                          전체 지역 보기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PetsittersPage() {
  return (
    <Suspense>
      <PetsittersContent />
    </Suspense>
  );
}
