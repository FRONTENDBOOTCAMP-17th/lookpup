"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Phone, MapPin, Calendar, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Header from "@/components/layout/Header";
import { AvatarWithCamera } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/switch";
import { CustomModal } from "@/components/common/CustomModal";
import { useUserStore } from "@/store/userStore";
import { updateUserInfo, updateOwnerLocation } from "@/app/actions/users";
import {
  searchAddressList,
  coordToRegion,
  type AddressSuggestion,
} from "@/utils/kakaoGeocode";

interface PendingAddress {
  address: string;
  lat: number;
  lng: number;
  dong: string;
}

type Tab = "profile" | "notifications";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "프로필 정보" },
  { id: "notifications", label: "알림 설정" },
];

const NOTIFICATION_ITEMS = [
  {
    label: "예약 알림",
    description: "예약 확정, 변경, 취소 알림을 받습니다",
    enabled: true,
  },
  {
    label: "채팅 메시지",
    description: "새로운 메시지가 도착하면 알림을 받습니다",
    enabled: true,
  },
  {
    label: "리뷰 알림",
    description: "새로운 리뷰가 등록되면 알림을 받습니다",
    enabled: true,
  },
  {
    label: "마케팅 알림",
    description: "이벤트 및 프로모션 소식을 받습니다",
    enabled: false,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState<Tab>("notifications");
  const [notifications, setNotifications] = useState(NOTIFICATION_ITEMS);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [savedAddress, setSavedAddress] = useState<{
    address: string;
    dong: string;
  } | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<PendingAddress | null>(
    null,
  );
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setPhoneNumber(user.phoneNumber);
    setBirthdate(user.birthdate ?? "");
  }, [user]);

  // 전역 유저 스토어(UserProvider가 앱 진입 시 미리 채워둠)의 위치 정보를 그대로 반영
  useEffect(() => {
    if (!user?.address) return;
    setSavedAddress({
      address: user.address,
      dong: user.displayArea || user.address,
    });
    setAddressQuery(user.address);
  }, [user?.address, user?.displayArea]);

  // 주소 검색어 변경 → 자동완성 (300ms debounce, 자유 텍스트 저장은 막고 드롭다운 선택만 허용)
  const handleAddressInputChange = (value: string) => {
    setAddressQuery(value);
    setPendingAddress(null);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }
    addressDebounceRef.current = setTimeout(async () => {
      const results = await searchAddressList(q);
      setAddressSuggestions(results);
      setShowAddressSuggestions(results.length > 0);
    }, 300);
  };

  const handleSelectAddress = async (s: AddressSuggestion) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    setAddressQuery(s.addressName);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    const region = await coordToRegion(s.lat, s.lng);
    const dong = region
      ? [region.sido, region.sigungu, region.dong].filter(Boolean).join(" ")
      : s.addressName;
    setPendingAddress({ address: s.addressName, lat: s.lat, lng: s.lng, dong });
  };

  const toggleNotification = (index: number) => {
    setNotifications((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const result = await updateUserInfo({
      fullName,
      phoneNumber,
      birthdate: birthdate || null,
    });

    if ("error" in result) {
      setIsSaving(false);
      setSaveError(result.error?.message ?? "저장 중 오류가 발생했습니다.");
      return;
    }

    const newAddress = pendingAddress;

    if (newAddress) {
      const locationResult = await updateOwnerLocation({
        address: newAddress.address,
        lat: newAddress.lat,
        lng: newAddress.lng,
        dong: newAddress.dong,
      });

      if ("error" in locationResult) {
        setIsSaving(false);
        setSaveError(
          locationResult.error?.message ?? "주소 저장 중 오류가 발생했습니다.",
        );
        return;
      }

      setSavedAddress({ address: newAddress.address, dong: newAddress.dong });
      setPendingAddress(null);
    }

    if (user) {
      setUser({
        ...user,
        fullName: result.data.full_name ?? "",
        phoneNumber: result.data.phone_number ?? "",
        birthdate: result.data.birthdate ?? null,
        address: newAddress?.address ?? user.address,
        displayArea: newAddress?.dong ?? user.displayArea,
        latitude: newAddress?.lat ?? user.latitude,
        longitude: newAddress?.lng ?? user.longitude,
      });
    }

    setIsSaving(false);
    setShowSaveModal(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 카카오맵 SDK — 주소 검색에 사용 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => {})}
      />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">
            프로필 설정
          </span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">프로필 설정</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              계정 정보 및 설정을 관리하세요
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
          {/* 사이드바 */}
          <aside className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5 w-full lg:w-72 lg:shrink-0">
            <div className="flex flex-col items-center">
              <AvatarWithCamera
                initial={user?.fullName?.[0] ?? ""}
                className="mb-4"
              />
              <p className="text-[#281A0E] text-xl font-bold">
                {user?.fullName ?? ""}
              </p>
              <p className="mt-1 mb-3 text-[#6B7280] text-sm">
                {user?.email ?? ""}
              </p>
              <span
                className={`px-3 py-1 rounded-md text-white text-xs font-medium ${user?.isVerified ? "bg-[#E8742A]" : "bg-[#9CA3AF]"}`}
              >
                {user?.isVerified ? "본인인증 완료" : "본인인증 미완료"}
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full h-12 rounded-xl text-left px-4 text-base font-medium transition-all ${activeTab === tab.id ? "bg-[#E8742A] text-white" : "bg-[#FFF8F3] text-[#6B7280] hover:bg-[#FFF0E8]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <div className="flex-1 flex flex-col gap-6">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                  기본 정보
                </h2>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">이름</p>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center px-4 text-[#281A0E] text-base outline-none focus:border-[#E8742A]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">이메일</p>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <div className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#6B7280] text-base">
                        {user?.email ?? ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">
                      휴대폰 번호
                    </p>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#281A0E] text-base outline-none focus:border-[#E8742A]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">주소</p>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        value={addressQuery}
                        onChange={(e) =>
                          handleAddressInputChange(e.target.value)
                        }
                        onFocus={() =>
                          addressSuggestions.length > 0 &&
                          setShowAddressSuggestions(true)
                        }
                        placeholder="도로명 또는 지번 주소 검색"
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#281A0E] text-base outline-none focus:border-[#E8742A]"
                      />
                      {showAddressSuggestions &&
                        addressSuggestions.length > 0 && (
                          <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-y-auto bg-white border border-[#FFE9D6] rounded-xl shadow-lg py-1">
                            {addressSuggestions.map((s, i) => (
                              <li key={`${s.addressName}-${i}`}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectAddress(s)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-[#FFF0E8] transition-colors"
                                >
                                  <span className="block text-sm font-medium text-[#281A0E]">
                                    {s.roadAddress ?? s.addressName}
                                  </span>
                                  {s.jibunAddress && s.roadAddress && (
                                    <span className="block text-xs text-[#9CA3AF] mt-0.5">
                                      {s.jibunAddress}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    {pendingAddress ? (
                      <p className="text-xs text-[#6B7280] px-1">
                        선택됨: {pendingAddress.dong} · 저장하기를 눌러야
                        반영돼요.
                      </p>
                    ) : (
                      savedAddress && (
                        <p className="text-xs text-[#9CA3AF] px-1">
                          현재 등록된 위치: {savedAddress.dong}
                        </p>
                      )
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">
                      생년월일
                    </p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] pl-12 pr-4 text-[#281A0E] text-base outline-none focus:border-[#E8742A]"
                      />
                    </div>
                  </div>
                  {saveError && (
                    <p className="text-sm text-red-500">{saveError}</p>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (!user) return;
                        setFullName(user.fullName);
                        setPhoneNumber(user.phoneNumber);
                        setBirthdate(user.birthdate ?? "");
                        setAddressQuery(savedAddress?.address ?? "");
                        setPendingAddress(null);
                        setAddressSuggestions([]);
                        setShowAddressSuggestions(false);
                        setSaveError(null);
                      }}
                      className="flex-1 h-12 px-6 bg-white rounded-[10px] border border-[#E8742A] text-[#E8742A] text-base font-semibold"
                    >
                      취소
                    </button>
                    {/* 저장하기 기능 모달 */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 h-12 px-6 bg-[#E8742A] rounded-[10px] text-white text-base font-semibold disabled:opacity-50"
                    >
                      {isSaving ? "저장 중..." : "저장하기"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                  알림 설정
                </h2>
                <div className="flex flex-col gap-4">
                  {notifications.map((item, index) => (
                    <div
                      key={item.label}
                      className="w-full p-4 bg-[#FFF8F3] rounded-xl flex justify-between items-center gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-[#281A0E] text-base font-semibold">
                          {item.label}
                        </p>
                        <p className="text-[#6B7280] text-sm">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => toggleNotification(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 저장하기 기능 모달 */}
      <CustomModal
        open={showSaveModal}
        preset="saveConfirm"
        onClose={() => setShowSaveModal(false)}
        onConfirm={() => setShowSaveModal(false)}
      />
    </div>
  );
}
