"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, LocateFixed, X } from "lucide-react";
import {
  coordToRegion,
  searchAddressList,
  coordToAddress,
  type AddressSuggestion,
} from "@/utils/kakaoGeocode";
import { updateOwnerLocation } from "@/app/actions/users";
import { useUserStore } from "@/store/userStore";

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  dong: string;
}

interface LocationEditModalProps {
  open: boolean;
  initialData: LocationData | null;
  onClose: () => void;
  onSave: (data: LocationData) => void;
}

export default function LocationEditModal({
  open,
  initialData,
  onClose,
  onSave,
}: LocationEditModalProps) {
  const { user, setUser } = useUserStore();

  const [locationInput, setLocationInput] = useState("");
  const [detailInput, setDetailInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<LocationData | null>(null);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationModalError, setLocationModalError] = useState<string | null>(null);

  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);

  // 모달 열릴 때 초기값 설정
  useEffect(() => {
    if (!open) return;
    setLocationInput(initialData?.address ?? "");
    setDetailInput("");
    setPendingLocation(initialData ?? null);
    setLocationModalError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [open, initialData]);

  // 모달 닫힐 때 미니맵 인스턴스 초기화
  useEffect(() => {
    if (!open) {
      miniMapRef.current = null;
      miniMarkerRef.current = null;
    }
  }, [open]);

  const updateMiniMap = useCallback((lat: number, lng: number) => {
    if (!window.kakao?.maps || !miniMapContainerRef.current) return;
    const coords = new window.kakao.maps.LatLng(lat, lng);

    if (!miniMapRef.current) {
      miniMapRef.current = new window.kakao.maps.Map(miniMapContainerRef.current, {
        center: coords,
        level: 4,
      });
    } else {
      miniMapRef.current.setCenter(coords);
    }

    if (miniMarkerRef.current) miniMarkerRef.current.setMap(null);
    miniMarkerRef.current = new window.kakao.maps.Marker({
      map: miniMapRef.current,
      position: coords,
    });
  }, []);

  useEffect(() => {
    if (!pendingLocation) return;
    if (window.kakao?.maps) {
      window.kakao.maps.load(() =>
        updateMiniMap(pendingLocation.lat, pendingLocation.lng),
      );
    }
  }, [pendingLocation, updateMiniMap]);

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    setPendingLocation(null);
    setLocationModalError(null);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      const list = await searchAddressList(value.trim());
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
    }, 300);
  };

  const handleSelectSuggestion = async (s: AddressSuggestion) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setLocationInput(s.addressName);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationModalError(null);
    const region = await coordToRegion(s.lat, s.lng);
    const dong = region
      ? [region.sido, region.sigungu, region.dong].filter(Boolean).join(" ")
      : s.addressName;
    setPendingLocation({ address: s.addressName, lat: s.lat, lng: s.lng, dong });
  };

  const handleUseCurrentLocation = () => {
    setLocationModalError(null);
    if (!navigator.geolocation) {
      setLocationModalError("이 브라우저에서는 위치 정보를 사용할 수 없어요.");
      return;
    }
    setLocationSearching(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        const [region, address] = await Promise.all([
          coordToRegion(lat, lng),
          coordToAddress(lat, lng),
        ]);
        setLocationSearching(false);
        if (!region || !address) {
          setLocationModalError("주소를 확인하지 못했어요. 직접 주소를 검색해주세요.");
          return;
        }
        const dong = [region.sido, region.sigungu, region.dong].filter(Boolean).join(" ");
        setLocationInput(address);
        setPendingLocation({ address, lat, lng, dong });
      },
      () => {
        setLocationSearching(false);
        setLocationModalError("위치 권한을 허용한 뒤 다시 시도해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleConfirm = () => {
    if (!pendingLocation) {
      setLocationModalError("주소 검색 후 목록에서 주소를 선택해주세요.");
      return;
    }

    updateOwnerLocation({
      address: pendingLocation.address,
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      dong: pendingLocation.dong,
    });

    if (user) {
      setUser({
        ...user,
        address: pendingLocation.address,
        displayArea: pendingLocation.dong,
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
      });
    }

    onSave(pendingLocation);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-stone-900 text-lg font-semibold">위치 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* 주소 검색 입력 */}
        <div className="relative mb-3">
          <MapPin
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            placeholder="도로명 주소 검색 (예: 봉명동 123)"
            className="w-full h-12 pl-9 pr-4 bg-white border border-orange-200 rounded-xl text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-400 transition"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-y-auto bg-white border border-orange-100 rounded-xl shadow-lg py-1">
              {suggestions.map((s, i) => (
                <li key={`${s.addressName}-${i}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full px-4 py-2.5 text-left hover:bg-orange-50 transition-colors"
                  >
                    <span className="block text-sm font-medium text-stone-900">
                      {s.roadAddress ?? s.addressName}
                    </span>
                    {s.jibunAddress && s.roadAddress && (
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {s.jibunAddress}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 미니맵 미리보기 */}
        {pendingLocation ? (
          <div className="mb-3">
            <div
              ref={miniMapContainerRef}
              className="w-full h-36 rounded-xl overflow-hidden border border-orange-100"
            />
            <div className="flex items-start gap-1.5 mt-1.5 px-1">
              <MapPin size={13} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-900">{pendingLocation.dong}</p>
                <p className="text-xs text-gray-400">{pendingLocation.address}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-3 px-1">
            검색 결과 목록에서 주소를 선택하면 지도로 확인할 수 있어요.
          </p>
        )}

        {/* 상세주소 입력 */}
        <input
          type="text"
          value={detailInput}
          onChange={(e) => setDetailInput(e.target.value)}
          placeholder="상세주소 (동/호수 등, 선택사항)"
          className="w-full h-10 px-3 mb-3 bg-white border border-orange-100 rounded-xl text-sm text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 transition"
        />

        {/* 현재 위치 사용 */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locationSearching}
          className="flex items-center gap-1.5 text-orange-500 text-sm font-medium mb-3 hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          <LocateFixed size={15} />
          {locationSearching ? "위치 확인 중..." : "현재 위치 사용"}
        </button>

        {locationModalError && (
          <p className="text-xs text-red-500 mb-3">{locationModalError}</p>
        )}

        <p className="text-xs text-gray-400 mb-4">
          프로필에는 &quot;동&quot; 단위까지만 표시됩니다. 좌표는 거리 계산에만 사용돼요.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pendingLocation}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
