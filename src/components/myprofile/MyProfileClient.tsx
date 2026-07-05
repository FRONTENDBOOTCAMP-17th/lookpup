"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useUserStore, type UserProfile, type SitterData } from "@/store/userStore";
import {
  ChevronRight,
  Dog,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  Star,
  Wallet,
  AlertTriangle,
  BookOpen,
  User,
  UserX,
  Pencil,
  MapPin,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar, { AvatarMobile } from "@/components/ui/Avatar";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import LocationEditModal from "@/components/myprofile/LocationEditModal";
import SectionCard from "@/components/common/SectionCard";

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  dong: string;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  link: string;
}

function getMenuIconColor(index: number, total: number) {
  const colors = [
    "var(--color-orange-500)",
    "#EA7B32",
    "#EC833C",
    "#EE8B46",
    "#F09450",
    "#F29D5C",
    "#F4A667",
    "#F6AF72",
    "#F8B77C",
    "#FABF86",
  ];
  if (total <= 1) return colors[0];
  const colorIndex = Math.round((index / (total - 1)) * (colors.length - 1));
  return colors[colorIndex];
}

function MenuIcon({
  icon: Icon,
  size,
  color,
}: {
  icon: React.ElementType;
  size: number;
  color: string;
}) {
  return <Icon size={size} color={color} />;
}

const OWNER_MENU: MenuItem[] = [
  { id: "profile", icon: User, label: "내 프로필", link: "/myprofile" },
  { id: "pets", icon: Dog, label: "내 반려동물", link: "/myprofile/mypets" },
  { id: "bookings", icon: Calendar, label: "예약 내역", link: "/myprofile/booking-history?role=owner" },
  { id: "posts", icon: FileText, label: "게시글 관리", link: "/myprofile/posts" },
  { id: "reviews", icon: BookOpen, label: "후기 관리", link: "/myprofile/reviews" },
  { id: "settings", icon: Settings, label: "설정", link: "/myprofile/settings" },
  { id: "terms", icon: HelpCircle, label: "이용약관", link: "/terms" },
  { id: "report", icon: AlertTriangle, label: "신고하기", link: "/myprofile/report" },
  { id: "withdraw", icon: UserX, label: "회원 탈퇴", link: "/myprofile/settings/withdraw" },
];

const SITTER_MENU: MenuItem[] = [
  { id: "profile", icon: User, label: "내 프로필", link: "/myprofile" },
  { id: "bookings", icon: Calendar, label: "예약 내역", link: "/myprofile/booking-history?role=sitter" },
  { id: "reviews", icon: BookOpen, label: "후기 관리", link: "/myprofile/reviews" },
  { id: "earnings", icon: Wallet, label: "수익 관리", link: "/myprofile/earnings" },
  { id: "settings", icon: Settings, label: "설정", link: "/myprofile/settings" },
  { id: "terms", icon: HelpCircle, label: "이용약관", link: "/terms" },
  { id: "report", icon: AlertTriangle, label: "신고하기", link: "/myprofile/report" },
  { id: "withdraw", icon: UserX, label: "회원 탈퇴", link: "/myprofile/settings/withdraw" },
];

function SidebarItem({
  item,
  index,
  total,
  selected,
  onClick,
}: {
  item: MenuItem;
  index: number;
  total: number;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const iconColor = getMenuIconColor(index, total);
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
      <MenuIcon icon={Icon} size={16} color={iconColor} />
      <span className={`text-sm font-medium ${selected ? "text-orange-500" : "text-stone-900"}`}>
        {item.label}
      </span>
    </button>
  );
}

function IconHoverAction({ label, children }: { label: string; children: ReactNode }) {
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

export default function MyProfileClient({
  initialUser,
  initialSitter,
}: {
  initialUser?: UserProfile | null;
  initialSitter?: SitterData | null;
}) {
  const router = useRouter();
  const { user: storeUser, sitter: storeSitter, isLoading } = useUserStore();
  const user = storeUser ?? initialUser ?? null;
  const sitter = storeSitter ?? initialSitter ?? null;
  const isSitter = user?.role === "both" || user?.role === "admin";

  useEffect(() => {
    if (!isLoading && !user?.isVerified) {
      router.replace("/auth/verification");
    }
  }, [isLoading, user?.isVerified, router]);

  const [userType, setUserType] = useState<"owner" | "sitter">("owner");
  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    if (!user?.address || user.latitude == null || user.longitude == null) {
      setLocationData(null);
      return;
    }
    setLocationData({
      address: user.address,
      lat: user.latitude,
      lng: user.longitude,
      dong: user.displayArea || user.address,
    });
  }, [user?.address, user?.latitude, user?.longitude, user?.displayArea]);

  const menuItems = userType === "owner" ? OWNER_MENU : SITTER_MENU;
  const ownerProfile = user
    ? {
        name: user.fullName || "이름 미등록",
        initial: user.fullName?.charAt(0) || "?",
        src: user.profileImage,
        verified: user.isVerified,
        location: locationData?.dong || "위치 미등록",
      }
    : undefined;

  const handleMenuClick = (item: MenuItem) => {
    setSelectedMenu(item.id);
    if (item.id !== "profile") router.push(item.link);
  };

  const quickMenuItems = menuItems.filter(
    (m) => m.id !== "profile" && m.id !== "report" && m.id !== "withdraw",
  );

  const ownerLocationAction = (
    <IconHoverAction label={locationData ? "위치 수정하기" : "위치 등록하기"}>
      <button
        type="button"
        onClick={() => setShowLocationModal(true)}
        aria-label={locationData ? "위치 수정하기" : "위치 등록하기"}
        className="flex size-9 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100"
      >
        <MapPin size={16} />
      </button>
    </IconHoverAction>
  );

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <Header />

      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => {})}
      />

      <LocationEditModal
        open={showLocationModal}
        initialData={locationData}
        onClose={() => setShowLocationModal(false)}
        onSave={(data) => setLocationData(data)}
      />

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
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-12">
          <div className="flex gap-6">
            {/* 사이드바 */}
            <div className="w-72 shrink-0">
              <SectionCard className="sticky top-24 gap-0 overflow-hidden">
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

                {userType === "sitter" && (
                  <div className="space-y-3 mb-4 pb-4 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">평점</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
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
                      <span className="text-xs text-gray-500">이번 달 수익</span>
                      <span className="text-sm font-bold text-orange-500">-</span>
                    </div>
                  </div>
                )}

                <nav className="space-y-0.5">
                  {menuItems.map((item, index) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      index={index}
                      total={menuItems.length}
                      selected={selectedMenu === item.id}
                      onClick={() => handleMenuClick(item)}
                    />
                  ))}
                </nav>
              </SectionCard>
            </div>

            {/* 우측 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {selectedMenu === "profile" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-stone-900">내 프로필</h2>

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

                  <div className="bg-white border border-orange-100 rounded-2xl p-6">
                    <h3 className="text-lg text-stone-900 mb-4">빠른 메뉴</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickMenuItems.map((item) => {
                        const Icon = item.icon;
                        const iconColor = getMenuIconColor(
                          menuItems.findIndex((menu) => menu.id === item.id),
                          menuItems.length,
                        );
                        return (
                          <button
                            key={item.id}
                            onClick={() => router.push(item.link)}
                            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border border-orange-100">
                              <MenuIcon icon={Icon} size={16} color={iconColor} />
                            </div>
                            <span className="text-sm font-medium text-stone-900">
                              {item.label}
                            </span>
                            <ChevronRight size={16} className="text-gray-500 ml-auto" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {userType === "owner" &&
                    (isSitter ? null : (
                      <Link href="/sitter-register">
                        <div className="bg-gradient-to-r from-orange-500 to-stone-600 rounded-2xl p-7 flex items-center justify-between hover:opacity-90 transition-opacity">
                          <div>
                            <h3 className="font-bold text-white text-lg mb-1">펫시터로 활동하기</h3>
                            <p className="text-white/80 text-sm">추가 수입을 만들어보세요</p>
                          </div>
                          <ChevronRight size={32} className="text-white" />
                        </div>
                      </Link>
                    ))}
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

        {userType === "sitter" && (
          <SitterProfileCard action={<SitterActions />} className="mb-4" />
        )}

        <div className="space-y-2 mb-5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const iconColor = getMenuIconColor(index, menuItems.length);
            return (
              <Link key={item.id} href={item.link}>
                <div className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-4 shadow-sm border border-orange-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border border-orange-100">
                    <MenuIcon icon={Icon} size={20} color={iconColor} />
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

        {userType === "owner" &&
          (isSitter ? null : (
            <Link href="/sitter-register">
              <div className="bg-gradient-to-r from-orange-500 to-stone-600 rounded-2xl p-5 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-0.5">펫시터로 활동하기</h4>
                    <p className="text-xs text-white/80">추가 수입을 만들어보세요</p>
                  </div>
                  <ChevronRight size={28} className="text-white" />
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
