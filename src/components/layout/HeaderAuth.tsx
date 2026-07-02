"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { createClient } from "@/utils/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useUserStore } from "@/store/userStore";
import { loadNotificationPrefs, getNotificationCategory } from "@/lib/notificationPrefs";

type Notification = {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
};

function getNotifIcon(type: string) {
  switch (type) {
    case "application":
      return { icon: <Calendar size={14} className="text-orange-500" />, bg: "bg-orange-50" };
    case "application_selected":
      return { icon: <CheckCircle size={14} className="text-green-700" />, bg: "bg-green-100" };
    case "application_rejected":
      return { icon: <XCircle size={14} className="text-red-500" />, bg: "bg-red-50" };
    case "care_record":
      return { icon: <ClipboardList size={14} className="text-teal-600" />, bg: "bg-teal-50" };
    case "message":
      return { icon: <MessageSquare size={14} className="text-sky-600" />, bg: "bg-sky-100" };
    case "review":
      return { icon: <FileText size={14} className="text-purple-800" />, bg: "bg-pink-100" };
    default:
      return { icon: <Bell size={14} className="text-orange-500" />, bg: "bg-orange-50" };
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const HOVER_CARD_CLS =
  "bg-white border border-[#ffe9d6] rounded-xl ring-0 shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)]";

export default function HeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading, clearUser, unreadCount, setUnreadCount } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, startTransition] = useTransition();
  const userId = user?.id;

  const fetchUnreadCount = () => {
    fetch("/api/notifications?limit=1")
      .then((res) => res.json())
      .then((json) => {
        if (!json.data) return;
        const prefs = loadNotificationPrefs();
        if (!prefs.all) { setUnreadCount(0); return; }
        const unreadByType = json.data.unread_by_type ?? {};
        const filteredTotal = Object.entries(unreadByType).reduce(
          (sum, [type, count]) => {
            const category = getNotificationCategory(type);
            if (category && !prefs[category]) return sum;
            return sum + (count as number);
          }, 0,
        );
        setUnreadCount(filteredTotal);
      })
      .catch(() => {});
  };

  const fetchNotifications = () => {
    fetch("/api/notifications?limit=5")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setNotifications(json.data.notifications ?? []);
          setUnreadCount(json.data.unread_total ?? 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    fetchUnreadCount();
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, fetchUnreadCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn, userId]);

  if (isLoading) return <div className="w-24 shrink-0" />;

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/auth/login"
          className="h-9 px-4 inline-flex items-center justify-center rounded-[10px] border border-orange-500 bg-white text-orange-500 text-xs font-normal leading-5 hover:bg-orange-50 transition-colors"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* 알림 */}
      <HoverCard openDelay={120} closeDelay={150} onOpenChange={(open) => { if (open) fetchNotifications(); }}>
        <HoverCardTrigger asChild>
          <button type="button" aria-label="알림 보기" className="relative p-2 rounded-full hover:bg-orange-50 transition-colors">
            <Bell size={20} className="text-gray-500" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-4">
                {unreadCount}
              </span>
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="end" sideOffset={8} className={`w-80 p-0 overflow-hidden ${HOVER_CARD_CLS}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffe9d6]">
            <span className="text-stone-900 text-sm font-semibold">알림</span>
            {unreadCount > 0 && (
              <button type="button" onClick={() => startTransition(async () => { await markAllNotificationsRead(); fetchNotifications(); })} className="text-xs text-orange-500 hover:text-orange-600 transition-colors">
                모두 읽음 처리
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
                <Bell size={24} strokeWidth={1.5} />
                <p className="text-xs">새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const { icon, bg } = getNotifIcon(notif.type);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => startTransition(async () => {
                      if (!notif.is_read) await markNotificationRead(notif.id);
                      if (notif.link_url) router.push(notif.link_url);
                      fetchNotifications();
                    })}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-orange-50/50 transition-colors ${i < notifications.length - 1 ? "border-b border-[#ffe9d6]" : ""} ${notif.is_read ? "opacity-70" : ""}`}
                  >
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-4 truncate ${notif.is_read ? "text-gray-500" : "text-stone-900 font-medium"}`}>{notif.title}</p>
                      <p className="text-xs text-gray-400 leading-4 mt-0.5 truncate">{notif.content}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{relativeTime(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-[#ffe9d6]">
            <Link href="/notifications" className="flex items-center justify-center gap-1 py-3 text-xs text-orange-500 font-medium hover:bg-orange-50 transition-colors">
              전체 알림 보기
              <ChevronRight size={12} strokeWidth={2} />
            </Link>
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* 아바타 드롭다운 */}
      <HoverCard openDelay={80} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label="계정 메뉴 열기"
            className="ml-1 size-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center text-white text-sm font-bold leading-5 hover:ring-2 hover:ring-orange-200 transition cursor-pointer"
          >
            {user?.profileImage ? (
              <Image src={user.profileImage} alt="" width={36} height={36} className="rounded-full object-cover" />
            ) : (
              user?.fullName?.charAt(0) ?? "?"
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="end" sideOffset={8} className={`w-44 p-1 ${HOVER_CARD_CLS}`}>
          <button type="button" onClick={() => router.push("/myprofile")} className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors">
            <User size={16} className="text-orange-500 shrink-0" strokeWidth={1.8} />
            마이페이지
          </button>
          <button type="button" onClick={() => router.push("/chat")} className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors">
            <MessageSquare size={16} className="text-orange-500 shrink-0" strokeWidth={1.8} />
            채팅
          </button>
          {user?.role === "admin" && (
            <button type="button" onClick={() => router.push("/admin")} className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-stone-900 rounded-lg hover:bg-orange-50 transition-colors">
              <ShieldCheck size={16} className="text-orange-500 shrink-0" strokeWidth={1.8} />
              관리자 페이지
            </button>
          )}
          <div className="mx-2 my-1 h-px bg-[#ffe9d6]" />
          <button type="button" onClick={() => { clearUser(); signOut(); }} className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-gray-500 rounded-lg hover:bg-orange-50 transition-colors">
            <LogOut size={16} className="text-gray-400 shrink-0" strokeWidth={1.8} />
            로그아웃
          </button>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
