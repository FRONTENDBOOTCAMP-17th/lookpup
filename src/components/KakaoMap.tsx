"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    kakao: any;
  }
}

export interface MapMarker {
  lat: number;
  lng: number;
  id: number;
  certified?: boolean;
  name?: string;
  district?: string;
  neighborhood?: string;
}

interface KakaoMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  selectedMarkerId?: number | null;
  onMarkerClick?: (id: number) => void;
}

function markerImageUrl(selected = false): string {
  const color = "#f97316";
  const strokeColor = selected ? "#E8742A" : "white";
  const strokeWidth = selected ? 3 : 1.5;
  const width = selected ? 34 : 28;
  const height = selected ? 44 : 36;

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`
  );

  return `data:image/svg+xml,${svg}`;
}

export default function KakaoMap({
  markers,
  center,
  level = 7,
  className,
  selectedMarkerId,
  onMarkerClick,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const mapRef = useRef<any>(null);
  const kakaoMarkersRef = useRef<Map<number, any>>(new Map());
  const overlayRef = useRef<any>(null);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  function initMap() {
    if (!containerRef.current || !window.kakao?.maps) return;

    const mapCenter =
      center ??
      (markers[0]
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 37.4979, lng: 127.0276 });

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level,
    });

    mapRef.current = map;
    kakaoMarkersRef.current.clear();

    // 빈 곳 클릭 시 오버레이 닫기
    window.kakao.maps.event.addListener(map, "click", () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    });

    markers.forEach((marker) => {
      const { lat, lng, id, name, district, neighborhood } = marker;
      const isSelected = id === selectedMarkerId;
      const position = new window.kakao.maps.LatLng(lat, lng);

      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageUrl(isSelected),
        new window.kakao.maps.Size(isSelected ? 34 : 28, isSelected ? 44 : 36),
        { offset: new window.kakao.maps.Point(isSelected ? 17 : 14, isSelected ? 44 : 36) }
      );

      const kakaoMarker = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImage,
      });

      kakaoMarkersRef.current.set(id, kakaoMarker);

      window.kakao.maps.event.addListener(kakaoMarker, "click", () => {
        // 기존 오버레이 제거
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }

        map.panTo(position);
        onMarkerClickRef.current?.(id);

        // 이름표 오버레이 생성
        const content = document.createElement("div");
        content.innerHTML = `
          <div style="
            padding: 8px 10px;
            background: white;
            border: 1px solid #FFE9D6;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(232,116,42,0.16);
            color: #281A0E;
            font-size: 13px;
            white-space: nowrap;
            margin-bottom: 8px;
          ">
            <strong>${name ?? ""}</strong>
            <div style="color:#6B7280; font-size:12px; margin-top:2px;">
              ${district ?? ""} ${neighborhood ?? ""}
            </div>
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          position,
          content,
          yAnchor: 1,
        });
        overlay.setMap(map);
        overlayRef.current = overlay;
      });
    });
  }

  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, [markers, center, level, selectedMarkerId]);

  return (
    <div style={{ width: "100%", height: "100%" }} className={className}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(initMap)}
      />
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
