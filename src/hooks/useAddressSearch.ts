"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { searchAddressToCoord, coordToRegion } from "@/utils/kakaoGeocode";

// 폼에서 위치 관련 필드만 추려낸 제약. write/edit FormState 모두 충족.
type LocationFields = {
  location: string;
  latitude: number | null;
  longitude: number | null;
};

// 구인게시판 작성/수정 폼의 주소 검색 · 현재 위치 사용 로직 공유 훅.
// addressSearching / searchError / locationError 상태를 내부에서 관리하고,
// 결과를 setForm으로 location/latitude/longitude에 반영한다.
export function useAddressSearch<T extends LocationFields>(
  setForm: Dispatch<SetStateAction<T>>,
) {
  const [addressSearching, setAddressSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleAddressSearch = async (location: string) => {
    const query = location.trim();
    if (!query) return;
    setAddressSearching(true);
    setSearchError(null);
    setLocationError(null);
    const result = await searchAddressToCoord(query);
    setAddressSearching(false);
    if (!result) {
      setSearchError("주소를 찾을 수 없어요. 다시 입력해주세요.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      location: result.addressName,
      latitude: result.lat,
      longitude: result.lng,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저에서는 위치 정보를 사용할 수 없어요.");
      return;
    }
    setAddressSearching(true);
    setSearchError(null);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const region = await coordToRegion(lat, lng);
        setAddressSearching(false);
        setForm((prev) => ({
          ...prev,
          location: region
            ? `${region.sido} ${region.sigungu} ${region.dong}`
            : "현재 위치",
          latitude: lat,
          longitude: lng,
        }));
        if (pos.coords.accuracy > 1000) {
          setLocationError(
            "현재 위치가 부정확할 수 있어요. 정확한 주소를 직접 검색해주세요.",
          );
        }
      },
      (err) => {
        setAddressSearching(false);
        setLocationError(
          err.code === err.TIMEOUT
            ? "위치 확인이 너무 오래 걸려요. 다시 시도해주세요."
            : "위치 정보를 가져오지 못했어요. 권한을 확인해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return {
    addressSearching,
    searchError,
    locationError,
    setSearchError,
    setLocationError,
    handleAddressSearch,
    handleUseCurrentLocation,
  };
}
