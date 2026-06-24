"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { formatDistance } from "@/utils/distance";

declare global {
  interface Window {
    kakao: any;
  }
}

export interface MapMarker {
  lat: number;
  lng: number;
  id: string | number;
  name?: string;
  district?: string;
  neighborhood?: string;
  distanceKm?: number;
  certified?: boolean;
}

interface KakaoMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  selectedMarkerId?: string | number | null;
  onMarkerClick?: (id: string | number) => void;
  // 지도 빈 곳 클릭 시 클릭 지점 좌표 전달 (위치 직접 지정용)
  onMapClick?: (lat: number, lng: number) => void;
  basePosition?: { lat: number; lng: number };
  // 활동 반경 원 표시 (km 단위, 첫 번째 마커 기준)
  serviceRadius?: number;
}

function markerImageUrl(selected = false): string {
  const svg = selected
    ? encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#f97316" stroke="white" stroke-width="2.5"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>`,
      )
    : encodeURIComponent(
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
  onMapClick,
  basePosition,
  serviceRadius,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const kakaoMarkersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMapClickRef = useRef(onMapClick);
  const basePositionRef = useRef(basePosition);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    basePositionRef.current = basePosition;
  }, [basePosition]);

  // 재마운트 시 kakao가 이미 로드된 경우 직접 initMap 호출
  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, []);

  // center prop 변경 시 지도 pan
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
    }
  }, [center]);

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

    window.kakao.maps.event.addListener(
      mapRef.current,
      "click",
      (mouseEvent: any) => {
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }
        // 빈 곳 클릭 시 해당 좌표를 콜백으로 전달 (위치 직접 지정)
        const latlng = mouseEvent.latLng;
        onMapClickRef.current?.(latlng.getLat(), latlng.getLng());
      },
    );

    drawMarkers();
    drawServiceCircle();
  }

  function drawServiceCircle() {
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    const map = mapRef.current;
    if (!map || !serviceRadius || markers.length === 0) return;
    const { lat, lng } = markers[0];
    circleRef.current = new window.kakao.maps.Circle({
      center: new window.kakao.maps.LatLng(lat, lng),
      radius: serviceRadius * 1000,
      strokeWeight: 2,
      strokeColor: "#f97316",
      strokeOpacity: 0.7,
      fillColor: "#f97316",
      fillOpacity: 0.08,
    });
    circleRef.current.setMap(map);
  }

  function drawMarkers() {
    const map = mapRef.current;
    if (!map) return;

    kakaoMarkersRef.current.forEach((m) => m.setMap(null));
    kakaoMarkersRef.current = [];

    markers.forEach((marker) => {
      const { lat, lng, id, name, district, neighborhood, distanceKm } = marker;
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
        // 기존 오버레이 제거
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }
        // 기존 polyline 제거
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        map.panTo(position);
        onMarkerClickRef.current?.(id);

        // basePosition이 있으면 Polyline 그리기
        const base = basePositionRef.current;
        if (base) {
          polylineRef.current = new window.kakao.maps.Polyline({
            map,
            path: [
              new window.kakao.maps.LatLng(base.lat, base.lng),
              position,
            ],
            strokeWeight: 2,
            strokeColor: "#f97316",
            strokeOpacity: 0.6,
            strokeStyle: "dashed",
          });
        }

        const distanceRow =
          distanceKm !== undefined
            ? `<div style="color:#f97316; font-size:11px; margin-top:3px;">약 ${formatDistance(distanceKm)}</div>`
            : "";

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
            ${distanceRow}
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

  useEffect(() => {
    if (mapRef.current) {
      drawMarkers();
    }
  }, [markers, selectedMarkerId]);

  useEffect(() => {
    if (mapRef.current) {
      drawServiceCircle();
    }
  }, [serviceRadius, markers]);

  return (
    <div style={{ width: "100%", height: "100%" }} className={className}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(initMap)}
      />
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
