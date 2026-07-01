"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import Script from "next/script";
import {
  searchAddressList,
  coordToAddress,
  type AddressSuggestion,
} from "@/utils/kakaoGeocode";
import { ORANGE_MARKER_URL, ORANGE_MARKER_SIZE } from "@/utils/mapMarker";

export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
  displayArea: string;
}

interface LocationPickerWithMapProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  className?: string;
}

export default function LocationPickerWithMap({
  value,
  onChange,
  className = "",
}: LocationPickerWithMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [query, setQuery] = useState(value?.address ?? "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRef = useRef<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  );

  // 검색어 변경 시 자동완성 요청 (300ms debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddressList(q);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  }, [query]);

  // 지도 초기화
  function initMap() {
    if (!containerRef.current || !window.kakao?.maps || mapRef.current) return;
    const center = selectedRef.current ?? { lat: 37.5665, lng: 126.978 };
    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: selectedRef.current ? 7 : 9,
    });

    if (selectedRef.current) {
      placeMarker(selectedRef.current.lat, selectedRef.current.lng);
    }
  }

  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, []);

  function buildDisplayAreaFromAddress(addr: string): string {
    const parts = addr.split(" ");
    if (parts.length >= 3) return parts.slice(1).join(" ");
    return addr;
  }

  function buildDisplayArea(suggestion: AddressSuggestion): string {
    return buildDisplayAreaFromAddress(suggestion.addressName);
  }

  async function handleMarkerDragEnd() {
    if (!markerRef.current) return;
    const pos = markerRef.current.getPosition();
    const lat = pos.getLat();
    const lng = pos.getLng();
    const address = await coordToAddress(lat, lng);
    const resolvedAddress = address ?? query;
    setQuery(resolvedAddress);
    selectedRef.current = { lat, lng };
    onChange({
      address: resolvedAddress,
      lat,
      lng,
      displayArea: buildDisplayAreaFromAddress(resolvedAddress),
    });
  }

  function placeMarker(lat: number, lng: number) {
    const map = mapRef.current;
    if (!map) return;

    const position = new window.kakao.maps.LatLng(lat, lng);
    const markerImage = new window.kakao.maps.MarkerImage(
      ORANGE_MARKER_URL,
      new window.kakao.maps.Size(ORANGE_MARKER_SIZE.width, ORANGE_MARKER_SIZE.height),
      {
        offset: new window.kakao.maps.Point(
          ORANGE_MARKER_SIZE.offsetX,
          ORANGE_MARKER_SIZE.offsetY,
        ),
      },
    );

    if (!markerRef.current) {
      markerRef.current = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImage,
        draggable: true,
      });
      window.kakao.maps.event.addListener(
        markerRef.current,
        "dragend",
        handleMarkerDragEnd,
      );
    } else {
      markerRef.current.setPosition(position);
    }

    map.setCenter(position);
    map.setLevel(7);
  }

  function selectSuggestion(s: AddressSuggestion) {
    setQuery(s.addressName);
    setSuggestions([]);
    setShowSuggestions(false);
    selectedRef.current = { lat: s.lat, lng: s.lng };
    placeMarker(s.lat, s.lng);
    onChange({
      address: s.addressName,
      lat: s.lat,
      lng: s.lng,
      displayArea: buildDisplayArea(s),
    });
  }

  function handleClear() {
    setQuery("");
    setSuggestions([]);
    selectedRef.current = null;
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    onChange(null);
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(initMap)}
      />

      {/* 주소 검색 */}
      <div className="relative">
        <label className="block text-sm font-medium text-stone-900 mb-2">
          기준 주소 *
        </label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedRef.current) {
                selectedRef.current = null;
                onChange(null);
              }
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="도로명 또는 지번 주소 검색"
            className="w-full h-12 pl-9 pr-10 bg-white border border-[#ffe9d6] rounded-xl text-[15px] text-stone-900 placeholder:text-gray-400 outline-none focus:border-[var(--color-orange-500)] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 자동완성 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#ffe9d6] rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-[#fff0e5] last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={14}
                      className="text-orange-400 mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm text-stone-900">
                        {s.roadAddress ?? s.addressName}
                      </p>
                      {s.jibunAddress && s.jibunAddress !== s.roadAddress && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.jibunAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 지도 미리보기 */}
      <div>
        <p className="text-sm font-medium text-stone-900 mb-2">지도 미리보기</p>
        {value ? (
          <div className="rounded-xl overflow-hidden border border-[#ffe9d6] h-56">
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-56 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-[#ffe9d6] flex flex-col items-center justify-center gap-2"
          >
            <MapPin size={28} className="text-orange-300" />
            <span className="text-sm text-gray-400">
              주소를 검색하면 지도가 표시됩니다
            </span>
          </div>
        )}
        {value && (
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} className="text-orange-400 shrink-0" />
            {value.displayArea}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          지도 핀을 드래그해 위치를 조정할 수 있어요. 개인정보 보호를 위해
          좌표는 약 100m 오차 내로 저장되어, 핀 위치가 입력한 주소와 약간
          다르게 보일 수 있어요.
        </p>
      </div>
    </div>
  );
}
