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
}

interface KakaoMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  onMarkerClick?: (id: number) => void;
}

function markerImageUrl(certified: boolean): string {
  const color = certified ? "#f97316" : "#9ca3af";
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`
  );
  return `data:image/svg+xml,${svg}`;
}

export default function KakaoMap({
  markers,
  center,
  level = 7,
  className,
  onMarkerClick,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  function initMap() {
    if (!containerRef.current || !window.kakao?.maps) return;

    const mapCenter =
      center ??
      (markers[0]
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 37.5665, lng: 126.978 });

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level,
    });

    markers.forEach(({ lat, lng, id, certified = false }) => {
      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageUrl(certified),
        new window.kakao.maps.Size(28, 36),
        { offset: new window.kakao.maps.Point(14, 36) }
      );

      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(lat, lng),
        image: markerImage,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        onMarkerClickRef.current?.(id);
      });
    });
  }

  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, [markers, center, level]);

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
