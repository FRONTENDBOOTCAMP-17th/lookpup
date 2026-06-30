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
  onMapClick?: (lat: number, lng: number) => void;
  basePosition?: { lat: number; lng: number };
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
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerOverlaysRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMapClickRef = useRef(onMapClick);
  const basePositionRef = useRef(basePosition);
  const markersRef = useRef(markers);
  const selectedMarkerIdRef = useRef(selectedMarkerId);
  const markerClickGuardRef = useRef(false);
  const markerClickGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    basePositionRef.current = basePosition;
  }, [basePosition]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    selectedMarkerIdRef.current = selectedMarkerId;
  }, [selectedMarkerId]);

  useEffect(() => {
    return () => {
      if (markerClickGuardTimerRef.current) {
        clearTimeout(markerClickGuardTimerRef.current);
      }
      clearMarkerOverlays();
      clearSelectedGraphics();
    };
  }, []);

  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, []);

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
        if (markerClickGuardRef.current) {
          markerClickGuardRef.current = false;
          return;
        }
        clearSelectedGraphics();
        const latlng = mouseEvent.latLng;
        onMapClickRef.current?.(latlng.getLat(), latlng.getLng());
      },
    );

    drawMarkers();
  }

  function clearMarkerOverlays() {
    markerOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    markerOverlaysRef.current = [];
  }

  function clearSelectedGraphics() {
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }

  function drawMarkers() {
    const map = mapRef.current;
    if (!map) return;

    clearMarkerOverlays();

    markersRef.current.forEach((marker) => {
      const { lat, lng, id } = marker;
      const selected = String(selectedMarkerIdRef.current) === String(id);
      const opt = getMarkerSize(selected);
      const position = new window.kakao.maps.LatLng(lat, lng);

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `${marker.name ?? "펫시터"} 선택`);
      button.style.cssText = `
        width: ${Math.max(opt.width, 44)}px;
        height: ${Math.max(opt.height, 44)}px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
      `;

      const image = document.createElement("img");
      image.src = markerImageUrl(selected);
      image.alt = "";
      image.draggable = false;
      image.style.cssText = `
        width: ${opt.width}px;
        height: ${opt.height}px;
        pointer-events: none;
      `;
      button.appendChild(image);

      const stopMapEvent = (event: Event) => {
        event.stopPropagation();
      };
      button.addEventListener("pointerdown", stopMapEvent);
      button.addEventListener("mousedown", stopMapEvent);
      button.addEventListener("touchstart", stopMapEvent, { passive: true });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectMarker(id);
      });

      const markerOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content: button,
        xAnchor: opt.offsetX / opt.width,
        yAnchor: opt.offsetY / opt.height,
        zIndex: selected ? 20 : 10,
        clickable: true,
      });
      markerOverlay.setZIndex(selected ? 20 : 10);
      markerOverlay.setMap(map);
      markerOverlaysRef.current.push(markerOverlay);
    });
  }

  function selectMarker(id: string | number) {
    markerClickGuardRef.current = true;
    if (markerClickGuardTimerRef.current) {
      clearTimeout(markerClickGuardTimerRef.current);
    }
    markerClickGuardTimerRef.current = setTimeout(() => {
      markerClickGuardRef.current = false;
    }, 100);
    selectedMarkerIdRef.current = id;
    drawMarkers();
    showSelectedMarker(id);
    onMarkerClickRef.current?.(id);
  }

  function showSelectedMarker(id: string | number | null | undefined) {
    const map = mapRef.current;
    if (!map) return;

    if (id == null) {
      clearSelectedGraphics();
      return;
    }

    const marker = markersRef.current.find((m) => String(m.id) === String(id));
    if (!marker) return;

    const position = new window.kakao.maps.LatLng(marker.lat, marker.lng);
    map.panTo(position);
    clearSelectedGraphics();

    const base = basePositionRef.current;
    if (base) {
      polylineRef.current = new window.kakao.maps.Polyline({
        map,
        path: [new window.kakao.maps.LatLng(base.lat, base.lng), position],
        strokeWeight: 2,
        strokeColor: "#f97316",
        strokeOpacity: 0.6,
        strokeStyle: "dashed",
      });
    }

    const { name, district, neighborhood, distanceKm } = marker;
    const distanceRow =
      distanceKm !== undefined
        ? `<div style="color:#f97316; font-size:11px; margin-top:3px;">약 ${formatDistance(distanceKm)}</div>`
        : "";

    const inner = document.createElement("div");
    inner.style.cssText = `
      padding: 8px 10px;
      background: white;
      border: 1px solid #FFE9D6;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(232,116,42,0.16);
      color: #281A0E;
      font-size: 13px;
      white-space: nowrap;
      margin-bottom: 8px;
    `;
    inner.innerHTML = `
      <strong>${name ?? ""}</strong>
      <div style="color:#6B7280; font-size:12px; margin-top:2px;">
        ${district ?? ""} ${neighborhood ?? ""}
      </div>
      ${distanceRow}
    `;

    const content = document.createElement("div");
    content.appendChild(inner);

    overlayRef.current = new window.kakao.maps.CustomOverlay({
      position,
      content,
      yAnchor: 1,
      zIndex: 100,
    });
    overlayRef.current.setZIndex(100);
    overlayRef.current.setMap(map);
  }

  useEffect(() => {
    if (mapRef.current) {
      drawMarkers();
    }
  }, [markers, selectedMarkerId]);

  useEffect(() => {
    showSelectedMarker(selectedMarkerId);
  }, [selectedMarkerId]);

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
