"use client";

import { useEffect, useRef, useState } from "react";
import {
  coordToRegion,
  searchAddressToCoord,
  searchPlaceToCoord,
} from "@/utils/kakaoGeocode";
import { getOwnerLocation } from "@/app/actions/users";
import { useLocationConsentQuery } from "./useLocationConsentQuery";
import { useGrantLocationConsentMutation } from "./useGrantLocationConsentMutation";

export const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

interface UsePetsitterLocationOptions {
  urlCity: string;
  urlDistrict: string;
  urlDong: string;
}

export function usePetsitterLocation({
  urlCity,
  urlDistrict,
  urlDong,
}: UsePetsitterLocationOptions) {
  const [basePosition, setBasePosition] = useState(DEFAULT_CENTER);
  const [baseLabel, setBaseLabel] = useState("강남역");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { data: consent } = useLocationConsentQuery();
  const grantConsent = useGrantLocationConsentMutation();
  const consentHandledRef = useRef(false);

  async function requestLocationSilently() {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저는 위치 서비스를 지원하지 않아요.");
      return;
    }
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "denied") {
          const { data: saved } = await getOwnerLocation();
          if (saved) {
            setBasePosition({ lat: saved.lat, lng: saved.lng });
            setBaseLabel(`저장된 위치 (${saved.dong || saved.address})`);
            return;
          }
          setLocationError("브라우저 위치 권한이 차단되어 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.");
          return;
        }
      } catch {
        // 일부 브라우저는 geolocation permission query를 지원하지 않음 - 아래 getCurrentPosition으로 폴백
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
        if (region) setBaseLabel(`현재 위치 (${region.dong || region.sigungu})`);
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
          setLocationError("브라우저 위치 권한이 차단되어 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.");
        } else {
          setLocationError("위치를 가져올 수 없어요. 강남역 기준으로 표시됩니다.");
        }
      },
      { timeout: 10000 },
    );
  }

  useEffect(() => {
    if (!urlDistrict) return;
    const query = [urlCity, urlDistrict, urlDong].filter(Boolean).join(" ");
    async function run() {
      const result = (await searchAddressToCoord(query)) ?? (await searchPlaceToCoord(query));
      if (result) setBasePosition({ lat: result.lat, lng: result.lng });
    }
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(run);
    } else {
      const MAX_ATTEMPTS = 100; // 100ms * 100 = 10초
      let attempts = 0;
      const id = setInterval(() => {
        attempts += 1;
        if (window.kakao?.maps?.load) {
          clearInterval(id);
          window.kakao.maps.load(run);
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(id);
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, [urlCity, urlDistrict, urlDong]);

  useEffect(() => {
    if (!consent || consentHandledRef.current) return;
    consentHandledRef.current = true;
    if (urlDistrict) return;
    if (consent.hasConsent) {
      // 브라우저 Geolocation API 호출이라 effect가 맞는 위치
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestLocationSilently();
    } else {
      setShowLocationModal(true);
    }
  }, [consent, urlDistrict]);

  async function requestLocation() {
    setShowLocationModal(false);
    await grantConsent.mutateAsync(consent?.userId ?? null);
    requestLocationSilently();
  }

  return {
    basePosition,
    setBasePosition,
    baseLabel,
    setBaseLabel,
    locationLoading,
    locationError,
    showLocationModal,
    dismissLocationModal: () => setShowLocationModal(false),
    currentUserId: consent?.userId ?? null,
    requestLocation,
  };
}
