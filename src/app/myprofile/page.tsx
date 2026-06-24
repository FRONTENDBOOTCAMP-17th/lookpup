"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import {
  ChevronRight,
  Dog,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Star,
  Wallet,
  MessageCircle,
  Bell,
  AlertTriangle,
  BookOpen,
  User,
  UserX,
  Pencil,
  MapPin,
  LocateFixed,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar, { AvatarMobile } from "@/components/ui/Avatar";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { signOut } from "@/app/actions/auth";
import {
  coordToRegion,
  searchAddressList,
  coordToAddress,
  type AddressSuggestion,
} from "@/utils/kakaoGeocode";

const OWNER_LOCATION_STORAGE_KEY = "lookpup_owner_location";

interface OwnerLocationData {
  address: string;
  detailAddress: string;
  lat: number;
  lng: number;
  dong: string;
}

function parseStoredLocation(raw: string | null): OwnerLocationData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.dong && parsed.lat) {
      return { detailAddress: "", ...parsed } as OwnerLocationData;
    }
  } catch {
    // 좌표 없는 구 포맷은 무효
  }
  return null;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  link: string;
  color: string;
}

const OWNER_MENU: MenuItem[] = [
  {
    id: "profile",
    icon: User,
    label: "내 프로필",
    link: "/myprofile",
    color: "#E8742A",
  },
  {
    id: "pets",
    icon: Dog,
    label: "내 반려동물",
    link: "/myprofile/mypets",
    color: "#F59E0B",
  },
  {
    id: "bookings",
    icon: Calendar,
    label: "예약 내역",
    link: "/myprofile/booking-history",
    color: "#10B981",
  },
  {
    id: "posts",
    icon: FileText,
    label: "게시글 관리",
    link: "/myprofile/posts",
    color: "#E8742A",
  },
  {
    id: "reviews",
    icon: BookOpen,
    label: "후기 관리",
    link: "/myprofile/reviews",
    color: "#3B82F6",
  },
  {
    id: "settings",
    icon: Settings,
    label: "설정",
    link: "/myprofile/settings",
    color: "#8B5CF6",
  },
  {
    id: "terms",
    icon: HelpCircle,
    label: "이용약관",
    link: "/terms",
    color: "#6B7280",
  },
  {
    id: "report",
    icon: AlertTriangle,
    label: "신고하기",
    link: "/myprofile/report",
    color: "#DC2626",
  },
  {
    id: "withdraw",
    icon: UserX,
    label: "회원 탈퇴",
    link: "/myprofile/settings/withdraw",
    color: "#EF4444",
  },
];

const SITTER_MENU: MenuItem[] = [
  {
    id: "profile",
    icon: User,
    label: "내 프로필",
    link: "/myprofile",
    color: "#E8742A",
  },
  {
    id: "bookings",
    icon: Calendar,
    label: "예약 관리",
    link: "/myprofile/booking-history",
    color: "#E8742A",
  },
  {
    id: "posts",
    icon: FileText,
    label: "게시글 관리",
    link: "/myprofile/posts",
    color: "#E8742A",
  },
  {
    id: "chat",
    icon: MessageCircle,
    label: "메시지",
    link: "/chat",
    color: "#10B981",
  },
  {
    id: "reviews",
    icon: BookOpen,
    label: "리뷰 관리",
    link: "/myprofile/reviews",
    color: "#F59E0B",
  },
  {
    id: "earnings",
    icon: Wallet,
    label: "수익 관리",
    link: "/myprofile/earnings",
    color: "#3B82F6",
  },
  {
    id: "notif",
    icon: Bell,
    label: "알림 설정",
    link: "/myprofile/settings",
    color: "#8B5CF6",
  },
  {
    id: "terms",
    icon: HelpCircle,
    label: "이용약관",
    link: "/terms",
    color: "#6B7280",
  },
  {
    id: "report",
    icon: AlertTriangle,
    label: "신고하기",
    link: "/myprofile/report",
    color: "#DC2626",
  },
  {
    id: "withdraw",
    icon: UserX,
    label: "회원 탈퇴",
    link: "/myprofile/settings/withdraw",
    color: "#EF4444",
  },
];

function SidebarItem({
  item,
  selected,
  onClick,
}: {
  item: MenuItem;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
        selected
          ? "bg-orange-50 text-orange-500"
          : "text-gray-500 hover:bg-orange-50 hover:text-stone-900"
      }`}
    >
      {selected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
      )}
      <Icon size={16} style={{ color: selected ? "#E8742A" : item.color }} />
      <span
        className={`text-sm font-medium ${selected ? "text-orange-500" : "text-stone-900"}`}
      >
        {item.label}
      </span>
    </button>
  );
}

function IconHoverAction({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align="end"
        sideOffset={8}
        className="w-auto rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white"
      >
        {label}
      </HoverCardContent>
    </HoverCard>
  );
}

function SitterActions() {
  return (
    <div className="flex shrink-0 gap-2">
      <IconHoverAction label="프로필 보기">
        <Link
          href="/myprofile/sitter-profile"
          aria-label="프로필 보기"
          className="flex size-9 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100"
        >
          <User size={16} />
        </Link>
      </IconHoverAction>
      <IconHoverAction label="수정하기">
        <Link
          href="/myprofile/sitter-edit"
          aria-label="수정하기"
          className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
        >
          <Pencil size={16} />
        </Link>
      </IconHoverAction>
    </div>
  );
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user, sitter, isLoading } = useUserStore();
  const isSitter = user?.role === "both" || user?.role === "admin";

  useEffect(() => {
    if (!isLoading && !user?.isVerified) {
      router.replace("/auth/verification");
    }
  }, [isLoading, user?.isVerified, router]);

  const [userType, setUserType] = useState<"owner" | "sitter">("owner");
  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [ownerLocationData, setOwnerLocationData] =
    useState<OwnerLocationData | null>(() => {
      if (typeof window === "undefined") return null;
      return parseStoredLocation(
        localStorage.getItem(OWNER_LOCATION_STORAGE_KEY),
      );
    });

  // 위치 수정 모달
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [detailInput, setDetailInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // pendingLocation: 드롭다운에서 선택된 좌표 확정 주소 (자유 텍스트 저장 불가)
  const [pendingLocation, setPendingLocation] = useState<Omit<
    OwnerLocationData,
    "detailAddress"
  > | null>(null);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationModalError, setLocationModalError] = useState<string | null>(
    null,
  );
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);

  const menuItems = userType === "owner" ? OWNER_MENU : SITTER_MENU;
  const ownerProfile = user
    ? {
        name: user.fullName || "이름 미등록",
        initial: user.fullName?.charAt(0) || "?",
        src: user.profileImage,
        verified: user.isVerified,
        location: ownerLocationData?.dong || "위치 미등록",
      }
    : undefined;

  // 미니맵 초기화 / 위치 업데이트
  const updateMiniMap = useCallback((lat: number, lng: number) => {
    if (!window.kakao?.maps || !miniMapContainerRef.current) return;
    const coords = new window.kakao.maps.LatLng(lat, lng);

    if (!miniMapRef.current) {
      miniMapRef.current = new window.kakao.maps.Map(
        miniMapContainerRef.current,
        {
          center: coords,
          level: 4,
        },
      );
    } else {
      miniMapRef.current.setCenter(coords);
    }

    if (miniMarkerRef.current) miniMarkerRef.current.setMap(null);
    miniMarkerRef.current = new window.kakao.maps.Marker({
      map: miniMapRef.current,
      position: coords,
    });
  }, []);

  // pendingLocation 바뀌면 미니맵 갱신
  useEffect(() => {
    if (!pendingLocation) return;
    // SDK가 이미 로드된 경우
    if (window.kakao?.maps) {
      window.kakao.maps.load(() =>
        updateMiniMap(pendingLocation.lat, pendingLocation.lng),
      );
    }
  }, [pendingLocation, updateMiniMap]);

  // 모달 닫힐 때 미니맵 인스턴스 초기화
  useEffect(() => {
    if (!showLocationEditModal) {
      miniMapRef.current = null;
      miniMarkerRef.current = null;
    }
  }, [showLocationEditModal]);

  // 주소 검색 입력 → 자동완성 (pendingLocation 초기화)
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

  // 드롭다운 항목 선택 → 좌표 확정 (이 경로만 pendingLocation 설정)
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
    setPendingLocation({
      address: s.addressName,
      lat: s.lat,
      lng: s.lng,
      dong,
    });
  };

  // 현재 위치 사용 (보조) — 주소 변환 실패 시 저장하지 않음
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
          setLocationModalError(
            "주소를 확인하지 못했어요. 직접 주소를 검색해주세요.",
          );
          return;
        }
        const dong = [region.sido, region.sigungu, region.dong]
          .filter(Boolean)
          .join(" ");
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

  // 확인 — pendingLocation이 없으면 저장 불가 (자유 텍스트 차단)
  const handleConfirmLocation = () => {
    if (!pendingLocation) {
      setLocationModalError("주소 검색 후 목록에서 주소를 선택해주세요.");
      return;
    }
    const data: OwnerLocationData = {
      ...pendingLocation,
      detailAddress: detailInput.trim(),
    };
    setOwnerLocationData(data);
    localStorage.setItem(OWNER_LOCATION_STORAGE_KEY, JSON.stringify(data));
    setShowLocationEditModal(false);
    setLocationInput("");
    setDetailInput("");
    setPendingLocation(null);
  };

  const handleOpenLocationModal = () => {
    // 기존 데이터는 참고용으로만 표시 — pendingLocation은 null로 시작해 반드시 재선택 요구
    setLocationInput(ownerLocationData?.address ?? "");
    setDetailInput(ownerLocationData?.detailAddress ?? "");
    setPendingLocation(
      ownerLocationData
        ? {
            address: ownerLocationData.address,
            lat: ownerLocationData.lat,
            lng: ownerLocationData.lng,
            dong: ownerLocationData.dong,
          }
        : null,
    );
    setLocationModalError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowLocationEditModal(true);
  };

  const ownerLocationAction = (
    <IconHoverAction
      label={ownerLocationData ? "위치 수정하기" : "위치 등록하기"}
    >
      <button
        type="button"
        onClick={handleOpenLocationModal}
        aria-label={ownerLocationData ? "위치 수정하기" : "위치 등록하기"}
        className="flex size-9 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100"
      >
        <MapPin size={16} />
      </button>
    </IconHoverAction>
  );

  const handleMenuClick = (item: MenuItem) => {
    setSelectedMenu(item.id);
    if (item.id !== "profile") router.push(item.link);
  };

  const quickMenuItems = menuItems.filter(
    (m) => m.id !== "profile" && m.id !== "report" && m.id !== "withdraw",
  );

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <Header />

      {/* 카카오맵 SDK — 주소 검색·역지오코딩·미니맵에 사용 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => {})}
      />

      {/* 위치 수정 모달 */}
      {showLocationEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-900 text-lg font-semibold">
                위치 수정
              </h2>
              <button
                type="button"
                onClick={() => setShowLocationEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 주소 검색 입력 — 자유 텍스트 저장 불가, 반드시 드롭다운에서 선택 */}
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

              {/* 자동완성 드롭다운 */}
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

            {/* 미니맵 미리보기 — 주소 선택 후 표시 */}
            {pendingLocation ? (
              <div className="mb-3">
                <div
                  ref={miniMapContainerRef}
                  className="w-full h-36 rounded-xl overflow-hidden border border-orange-100"
                />
                <div className="flex items-start gap-1.5 mt-1.5 px-1">
                  <MapPin
                    size={13}
                    className="text-orange-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {pendingLocation.dong}
                    </p>
                    <p className="text-xs text-gray-400">
                      {pendingLocation.address}
                    </p>
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

            {/* 현재 위치 사용 (보조) */}
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
              프로필에는 &quot;동&quot; 단위까지만 표시됩니다. 좌표는 거리
              계산에만 사용돼요.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLocationEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={!pendingLocation}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 프로필 */}
      <div className="md:hidden bg-linear-to-br from-orange-500 to-orange-300 rounded-b-3xl px-5 pt-8 pb-8 shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <AvatarMobile
            initial={user?.fullName?.charAt(0) ?? "?"}
            src={user?.profileImage}
          />
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              {user?.fullName ?? ""}
            </h3>
            {user?.isVerified && (
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-white text-xs font-medium">본인인증</span>
              </div>
            )}
          </div>
        </div>
        {isSitter && (
          <div className="flex bg-white/20 backdrop-blur-sm rounded-full p-1">
            {(["owner", "sitter"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setUserType(type)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  userType === type ? "bg-white text-orange-500" : "text-white"
                }`}
              >
                {type === "owner" ? "보호자" : "펫시터"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 데스크탑 레이아웃 */}
      <div className="hidden md:block flex-1">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="flex gap-6">
            {/* 사이드바 */}
            <div className="w-72 shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] p-5 overflow-hidden">
                {/* 프로필 */}
                <div className="text-center pb-5 mb-4 border-b border-orange-100">
                  <Avatar
                    initial={user?.fullName?.charAt(0) ?? "?"}
                    src={user?.profileImage}
                    size="xl"
                    className="mx-auto mb-3"
                  />
                  <h2 className="text-2xl font-bold text-stone-900 mb-1">
                    {user?.fullName ?? ""}
                  </h2>
                  <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
                </div>

                {/* 역할 토글 */}
                {isSitter && (
                  <div className="flex bg-orange-50 rounded-full p-1 mb-4">
                    {(["owner", "sitter"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setUserType(type);
                          setSelectedMenu("profile");
                        }}
                        className={`flex-1 py-2 rounded-full text-sm transition-all ${
                          userType === type
                            ? "bg-orange-500 text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {type === "owner" ? "보호자" : "펫시터"}
                      </button>
                    ))}
                  </div>
                )}

                {/* 펫시터 사이드바 통계 */}
                {userType === "sitter" && (
                  <div className="space-y-3 mb-4 pb-4 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">평점</span>
                      <div className="flex items-center gap-1">
                        <Star
                          size={12}
                          className="fill-amber-400 text-amber-400"
                        />
                        <span className="text-sm font-bold text-stone-900">
                          {sitter?.rating.toFixed(1) ?? "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">완료 건수</span>
                      <span className="text-sm font-bold text-stone-900">
                        {sitter ? `${sitter.reviewCount}건` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        이번 달 수익
                      </span>
                      <span className="text-sm font-bold text-orange-500">
                        -
                      </span>
                    </div>
                  </div>
                )}

                {/* 메뉴 */}
                <nav className="space-y-0.5">
                  {menuItems.map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      selected={selectedMenu === item.id}
                      onClick={() => handleMenuClick(item)}
                    />
                  ))}
                </nav>

                <div className="mt-4 pt-4 border-t border-orange-100">
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-orange-50 transition-colors"
                  >
                    <LogOut size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">로그아웃</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 우측 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {selectedMenu === "profile" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-stone-900">
                    내 프로필
                  </h2>

                  {userType === "owner" && ownerProfile && (
                    <SitterProfileCard
                      profile={ownerProfile}
                      variant="owner"
                      action={ownerLocationAction}
                    />
                  )}

                  {userType === "sitter" && (
                    <SitterProfileCard action={<SitterActions />} />
                  )}

                  {/* 빠른 메뉴 */}
                  <div className="bg-white border border-orange-100 rounded-2xl p-6">
                    <h3 className="text-lg text-stone-900 mb-4">빠른 메뉴</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => router.push(item.link)}
                            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left"
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${item.color}20` }}
                            >
                              <Icon size={16} style={{ color: item.color }} />
                            </div>
                            <span className="text-sm font-medium text-stone-900">
                              {item.label}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-gray-500 ml-auto"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 펫시터 등록 CTA */}
                  {userType === "owner" && (
                    <Link href="/sitter-register">
                      <div className="bg-gradient-to-r from-orange-500 to-stone-600 rounded-2xl p-7 flex items-center justify-between hover:opacity-90 transition-opacity">
                        <div>
                          <h3 className="font-bold text-white text-lg mb-1">
                            펫시터로 활동하기
                          </h3>
                          <p className="text-white/80 text-sm">
                            추가 수입을 만들어보세요
                          </p>
                        </div>
                        <ChevronRight size={32} className="text-white" />
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="md:hidden flex-1 overflow-y-auto px-5 py-6">
        {userType === "owner" && ownerProfile && (
          <SitterProfileCard
            profile={ownerProfile}
            variant="owner"
            action={ownerLocationAction}
            className="mb-4"
          />
        )}

        {/* 펫시터 프로필 카드 (예약 관리 위) */}
        {userType === "sitter" && (
          <SitterProfileCard action={<SitterActions />} className="mb-4" />
        )}

        <div className="space-y-2 mb-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.link}>
                <div className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-4 shadow-sm border border-orange-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}18` }}
                  >
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-stone-900">
                    {item.label}
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* 펫시터 등록 CTA */}
        {userType === "owner" && (
          <Link href="/sitter-register">
            <div className="bg-gradient-to-r from-orange-500 to-stone-600 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-sm mb-0.5">
                    펫시터로 활동하기
                  </h4>
                  <p className="text-xs text-white/80">
                    추가 수입을 만들어보세요
                  </p>
                </div>
                <ChevronRight size={28} className="text-white" />
              </div>
            </div>
          </Link>
        )}

        {/* 로그아웃 */}
        <div className="pb-24">
          <button
            onClick={signOut}
            className="w-full bg-white border border-orange-100 rounded-2xl px-4 py-3.5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <LogOut size={20} className="text-gray-500" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-gray-500">
              로그아웃
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
