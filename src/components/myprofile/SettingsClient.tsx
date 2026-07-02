"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Phone, MapPin, Calendar, ChevronLeft, Building2, Check, X, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import Header from "@/components/layout/Header";
import { AvatarWithCamera } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/switch";
import { CustomModal } from "@/components/common/CustomModal";
import { useUserStore, type UserProfile } from "@/store/userStore";
import { updateUserInfo, updateOwnerLocation } from "@/app/actions/users";
import {
  searchAddressList,
  coordToRegion,
  type AddressSuggestion,
} from "@/utils/kakaoGeocode";
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationCategory,
} from "@/lib/notificationPrefs";

interface PendingAddress {
  address: string;
  lat: number;
  lng: number;
  dong: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
}

const BANK_LIST = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행",
  "기업은행", "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일은행",
  "씨티은행", "수협은행", "부산은행", "대구은행", "경남은행",
  "광주은행", "전북은행", "제주은행",
];

type Tab = "profile" | "notifications" | "bank";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "프로필 정보" },
  { id: "notifications", label: "알림 설정" },
  { id: "bank", label: "정산 계좌" },
];

const NOTIFICATION_ITEMS: {
  id: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "reservation",
    label: "예약 알림",
    description: "예약 확정, 변경, 취소 알림을 받습니다",
  },
  {
    id: "chat",
    label: "채팅 메시지",
    description: "새로운 메시지가 도착하면 알림을 받습니다",
  },
  {
    id: "review",
    label: "리뷰 알림",
    description: "새로운 리뷰가 등록되면 알림을 받습니다",
  },
  {
    id: "marketing",
    label: "마케팅 알림",
    description: "이벤트 및 프로모션 소식을 받습니다",
  },
];

export default function SettingsClient({
  initialUser,
  initialBankAccount,
}: {
  initialUser?: UserProfile | null;
  initialBankAccount?: BankAccount | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user) ?? initialUser ?? null;
  const setUser = useUserStore((s) => s.setUser);

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab === "bank" || initialTab === "notifications" ? initialTab : "profile",
  );
  const [notificationPrefs, setNotificationPrefs] = useState(
    loadNotificationPrefs(),
  );
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [fullName, setFullName] = useState(initialUser?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialUser?.phoneNumber ?? "");
  const [birthdate, setBirthdate] = useState(initialUser?.birthdate ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [bankAccount, setBankAccount] = useState<BankAccount | null>(initialBankAccount ?? null);
  const [bankLoading, setBankLoading] = useState(initialBankAccount === undefined);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");

  const [savedAddress, setSavedAddress] = useState<{
    address: string;
    dong: string;
  } | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<PendingAddress | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setPhoneNumber(user.phoneNumber);
    setBirthdate(user.birthdate ?? "");
  }, [user]);

  useEffect(() => {
    if (initialBankAccount !== undefined) {
      if (initialBankAccount) {
        setBankForm({ bank_name: initialBankAccount.bank_name, account_number: initialBankAccount.account_number, account_holder: initialBankAccount.account_holder });
      } else {
        setIsEditingBank(true);
      }
      return;
    }
    fetch("/api/bank-account")
      .then((r) => r.json())
      .then(({ data: d }) => {
        if (d) {
          setBankAccount(d);
          setBankForm({ bank_name: d.bank_name, account_number: d.account_number, account_holder: d.account_holder });
        } else {
          setIsEditingBank(true);
        }
      })
      .catch(() => {})
      .finally(() => setBankLoading(false));
  }, [initialBankAccount]);

  useEffect(() => {
    if (!user?.address) return;
    setSavedAddress({
      address: user.address,
      dong: user.displayArea || user.address,
    });
    setAddressQuery(user.address);
  }, [user?.address, user?.displayArea]);

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

  function startEditBank() {
    if (bankAccount) {
      setBankForm({ bank_name: bankAccount.bank_name, account_number: bankAccount.account_number, account_holder: bankAccount.account_holder });
    }
    setBankError("");
    setIsEditingBank(true);
  }

  async function saveBank() {
    if (!bankForm.bank_name || !bankForm.account_number.trim() || !bankForm.account_holder.trim()) {
      setBankError("모든 항목을 입력해주세요.");
      return;
    }
    setBankSaving(true);
    setBankError("");
    try {
      const res = await fetch("/api/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setBankError(json.error?.message ?? "저장에 실패했습니다.");
        return;
      }
      setBankAccount(json.data);
      setIsEditingBank(false);
    } catch {
      setBankError("저장 중 오류가 발생했습니다.");
    } finally {
      setBankSaving(false);
    }
  }

  const toggleNotification = (id: NotificationCategory) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveNotificationPrefs(next);
      return next;
    });
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

      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => {})}
      />

      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">프로필 설정</span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">프로필 설정</h2>
            <p className="text-sm text-[#6B7280] mt-1">계정 정보 및 설정을 관리하세요</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
          <aside className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5 w-full lg:w-72 lg:shrink-0">
            <div className="flex flex-col items-center">
              <AvatarWithCamera
                initial={user?.fullName?.[0] ?? ""}
                src={user?.profileImage}
                className="mb-4"
              />
              <p className="text-[#281A0E] text-xl font-bold">{user?.fullName ?? ""}</p>
              <p className="mt-1 mb-3 text-[#6B7280] text-sm">{user?.email ?? ""}</p>
              <span
                className={`px-3 py-1 rounded-md text-white text-xs font-medium ${user?.isVerified ? "bg-[var(--color-orange-500)]" : "bg-[#9CA3AF]"}`}
              >
                {user?.isVerified ? "본인인증 완료" : "본인인증 미완료"}
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full h-12 rounded-xl text-left px-4 text-base font-medium transition-all ${activeTab === tab.id ? "bg-[var(--color-orange-500)] text-white" : "bg-[#FFF8F3] text-[#6B7280] hover:bg-[#FFF0E8]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 flex flex-col gap-6">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">기본 정보</h2>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">이름</p>
                    <input
                      value={fullName}
                      disabled
                      className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center px-4 text-[#6B7280] text-base bg-[#F9FAFB] cursor-not-allowed"
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
                    <p className="text-[#281A0E] text-sm font-medium">휴대폰 번호</p>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        value={phoneNumber}
                        disabled
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#6B7280] text-base bg-[#F9FAFB] cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">주소</p>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        value={addressQuery}
                        disabled
                        placeholder="도로명 또는 지번 주소 검색"
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#6B7280] text-base bg-[#F9FAFB] cursor-not-allowed"
                      />
                      {false && showAddressSuggestions && addressSuggestions.length > 0 && (
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
                        선택됨: {pendingAddress.dong} · 저장하기를 눌러야 반영돼요.
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
                    <p className="text-[#281A0E] text-sm font-medium">생년월일</p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <input
                        type="date"
                        value={birthdate}
                        disabled
                        className="w-full h-12 rounded-xl border border-[#FFE9D6] pl-12 pr-4 text-[#6B7280] text-base bg-[#F9FAFB] cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">알림 설정</h2>
                <div className="flex flex-col gap-4">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="w-full p-4 bg-[#FFF8F3] rounded-xl flex justify-between items-center gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-[#281A0E] text-base font-semibold">{item.label}</p>
                        <p className="text-[#6B7280] text-sm">{item.description}</p>
                      </div>
                      <Switch
                        checked={notificationPrefs[item.id]}
                        onCheckedChange={() => toggleNotification(item.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFF8F3] flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-[var(--color-orange-500)]" />
                    </div>
                    <div>
                      <h2 className="text-[#281A0E] text-xl font-bold">정산 계좌</h2>
                      <p className="text-xs text-[#6B7280] mt-0.5">수익 정산에 사용할 계좌를 등록해주세요</p>
                    </div>
                  </div>
                  {!bankLoading && bankAccount && !isEditingBank && (
                    <button
                      onClick={startEditBank}
                      className="flex items-center gap-1.5 text-sm text-[var(--color-orange-500)] font-medium hover:opacity-80 transition-opacity"
                    >
                      <Pencil size={15} />
                      수정
                    </button>
                  )}
                </div>

                {bankLoading ? (
                  <div className="py-8 text-center text-[#6B7280] text-sm">불러오는 중...</div>
                ) : isEditingBank ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#281A0E] mb-1.5">은행 선택</label>
                      <select
                        value={bankForm.bank_name}
                        onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-[#FFE9D6] bg-white text-[#281A0E] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)] focus:border-transparent"
                      >
                        <option value="">은행을 선택해주세요</option>
                        {BANK_LIST.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#281A0E] mb-1.5">계좌번호</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="- 없이 숫자만 입력"
                        value={bankForm.account_number}
                        onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value.replace(/\D/g, "") }))}
                        className="w-full h-11 px-3 rounded-xl border border-[#FFE9D6] bg-white text-[#281A0E] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#281A0E] mb-1.5">예금주</label>
                      <input
                        type="text"
                        placeholder="예금주명 입력"
                        value={bankForm.account_holder}
                        onChange={(e) => setBankForm((f) => ({ ...f, account_holder: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-[#FFE9D6] bg-white text-[#281A0E] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)] focus:border-transparent"
                      />
                    </div>
                    {bankError && <p className="text-sm text-red-500">{bankError}</p>}
                    <div className="flex gap-3 pt-1 justify-end">
                      {bankAccount && (
                        <button
                          onClick={() => { setIsEditingBank(false); setBankError(""); }}
                          className="flex items-center gap-1.5 h-11 px-5 rounded-xl border border-[#FFE9D6] text-sm font-medium text-[#6B7280] hover:bg-[#FFF8F3] transition-colors"
                        >
                          <X size={15} />
                          취소
                        </button>
                      )}
                      <button
                        onClick={saveBank}
                        disabled={bankSaving}
                        className="flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[var(--color-orange-500)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Check size={15} />
                        {bankSaving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : bankAccount ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#FFF8F3] rounded-xl">
                      <p className="text-xs text-[#6B7280] mb-1">은행</p>
                      <p className="font-semibold text-[#281A0E]">{bankAccount.bank_name}</p>
                    </div>
                    <div className="p-4 bg-[#FFF8F3] rounded-xl">
                      <p className="text-xs text-[#6B7280] mb-1">계좌번호</p>
                      <p className="font-semibold text-[#281A0E]">{bankAccount.account_number}</p>
                    </div>
                    <div className="p-4 bg-[#FFF8F3] rounded-xl">
                      <p className="text-xs text-[#6B7280] mb-1">예금주</p>
                      <p className="font-semibold text-[#281A0E]">{bankAccount.account_holder}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomModal
        open={showSaveModal}
        preset="saveConfirm"
        onClose={() => setShowSaveModal(false)}
        onConfirm={() => setShowSaveModal(false)}
      />
    </div>
  );
}
