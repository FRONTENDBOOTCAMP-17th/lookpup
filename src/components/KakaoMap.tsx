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
  const svg = selected
    ? // 활성화 -> 원 + 오버레이
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#f97316" stroke="white" stroke-width="2.5"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>`,
      )
    : // 기본 상태: 핀 형태
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 26 16 26S32 26.667 32 16C32 7.163 24.837 0 16 0z" fill="#f97316" stroke="white" stroke-width="1.5"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`,
      );
  return `data:image/svg+xml,${svg}`;
}

function getMarkerSize(selected = false) {
  return selected
    ? { width: 24, height: 24, offsetX: 12, offsetY: 12 }
    : { width: 32, height: 42, offsetX: 16, offsetY: 42 };
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
  const mapRef = useRef<any>(null);
  const kakaoMarkersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 최초 1회 지도 초기화
  function initMap() {
    if (!containerRef.current || !window.kakao?.maps || mapRef.current) return;

    const mapCenter =
      center ??
      (markers[0]
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 37.4979, lng: 127.0276 });

    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level,
    });

    // 빈 곳 클릭 시 오버레이 닫기
    window.kakao.maps.event.addListener(mapRef.current, "click", () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    });

    drawMarkers();
  }

  // 마커만 다시 그리기 (지도 객체 유지)
  function drawMarkers() {
    const map = mapRef.current;
    if (!map) return;

    // 기존 마커 제거
    kakaoMarkersRef.current.forEach((m) => m.setMap(null));
    kakaoMarkersRef.current = [];

    markers.forEach((marker) => {
      const { lat, lng, id, name, district, neighborhood } = marker;
      const selected = selectedMarkerId === id;
      const opt = getMarkerSize(selected);
      const position = new window.kakao.maps.LatLng(lat, lng);

      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageUrl(selected),
        new window.kakao.maps.Size(opt.width, opt.height),
        { offset: new window.kakao.maps.Point(opt.offsetX, opt.offsetY) },
      );

      const kakaoMarker = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImage,
      });

      kakaoMarkersRef.current.push(kakaoMarker);

      window.kakao.maps.event.addListener(kakaoMarker, "click", () => {
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }

        map.panTo(position);
        onMarkerClickRef.current?.(id);

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

        overlayRef.current = new window.kakao.maps.CustomOverlay({
          position,
          content,
          yAnchor: 1,
        });
        overlayRef.current.setMap(map);
      });
    });
  }

  // markers 또는 selectedMarkerId 변경 시 마커만 다시 그림
  useEffect(() => {
    if (mapRef.current) {
      drawMarkers();
    }
  }, [markers, selectedMarkerId]);

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
