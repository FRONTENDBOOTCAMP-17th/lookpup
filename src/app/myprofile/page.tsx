"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar, { AvatarMobile } from "@/components/ui/Avatar";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import { signOut } from "@/app/actions/auth";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  link: string;
  color: string;
}

const DUMMY_OWNER_STATS = [
  { label: "총 예약", value: "12건" },
  { label: "완료 서비스", value: "9건" },
  { label: "찜한 시터", value: "5명" },
];

const DUMMY_SITTER_MAIN_STATS = [
  { label: "이번 달 예약", value: "8건" },
  { label: "완료 건수", value: "230건" },
  { label: "이번 달 수익", value: "850,000원" },
];



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

function SitterActions() {
  return (
    <div className="flex gap-2 mt-3">
      <Link
        href="/myprofile/sitter-profile"
        className="flex-1 py-2.5 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center gap-1.5 text-orange-500 text-xs font-medium hover:bg-orange-100 transition-colors"
      >
        <User size={13} />
        프로필 보기
      </Link>
      <Link
        href="/myprofile/sitter-edit"
        className="flex-1 py-2.5 bg-orange-500 rounded-xl flex items-center justify-center gap-1.5 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
      >
        <Pencil size={13} />
        수정하기
      </Link>
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

  const menuItems = userType === "owner" ? OWNER_MENU : SITTER_MENU;
  const statsCards =
    userType === "owner" ? DUMMY_OWNER_STATS : DUMMY_SITTER_MAIN_STATS;

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

                  {/* 통계 카드 */}
                  <div className="grid grid-cols-3 gap-4">
                    {statsCards.map((s) => (
                      <div
                        key={s.label}
                        className="bg-white border border-orange-100 rounded-2xl p-5 text-center"
                      >
                        <p className="font-bold text-orange-500 text-xl mb-1">
                          {s.value}
                        </p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* 펫시터 프로필 카드 */}
                  {userType === "sitter" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg text-stone-900">
                          펫시터 프로필
                        </h3>
                        <span className="text-xs text-gray-400">
                          공개 중인 프로필
                        </span>
                      </div>
                      <SitterProfileCard  />
                      <SitterActions />
                    </div>
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
        {/* 펫시터 프로필 카드 (예약 관리 위) */}
        {userType === "sitter" && (
          <div className="mb-4">
            <SitterProfileCard  />
            <SitterActions />
          </div>
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
          <Link href="/register/petsitter">
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
