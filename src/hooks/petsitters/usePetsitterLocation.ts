"use client";

import { useEffect, useState } from "react";
import {
  coordToRegion,
  searchAddressToCoord,
  searchPlaceToCoord,
} from "@/utils/kakaoGeocode";
import { createClient } from "@/utils/supabase/client";
import { getOwnerLocation } from "@/app/actions/users";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        setLocationError("브라우저 위치 권한이 차단되어 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.");
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

  // URL 지역 파라미터로 지도 초기화
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
      const id = setInterval(() => {
        if (window.kakao?.maps?.load) {
          clearInterval(id);
          window.kakao.maps.load(run);
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, [urlCity, urlDistrict, urlDong]);

  // 위치 동의 확인
  useEffect(() => {
    const browserClient = createClient();
    async function checkLocationConsent() {
      const {
        data: { user },
      } = await browserClient.auth.getUser();
      if (!user) {
        if (!urlDistrict) {
          const localConsent = localStorage.getItem("location_consent");
          if (localConsent !== "true") setShowLocationModal(true);
          else requestLocationSilently();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestLocation() {
    setShowLocationModal(false);
    const browserClient = createClient();
    if (currentUserId) {
      await browserClient.from("users").update({ location_consent: true }).eq("id", currentUserId);
    } else {
      localStorage.setItem("location_consent", "true");
    }
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
    currentUserId,
    requestLocation,
  };
}
