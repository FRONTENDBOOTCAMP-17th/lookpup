import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ChevronLeft, Bell } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { NotificationItem } from "./NotificationItem";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  link_url: string | null;
  created_at: string | null;
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const toKST = (d: Date) => new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const kstDate = toKST(new Date(dateStr));
  const kstNow = toKST(new Date());
  return (
    kstDate.getFullYear() === kstNow.getFullYear() &&
    kstDate.getMonth() === kstNow.getMonth() &&
    kstDate.getDate() === kstNow.getDate()
  );
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let notifications: NotificationRow[] = [];

  if (user) {
    const db = createServiceClient();
    const { data } = await db
      .from("notifications")
      .select("id, type, title, content, is_read, link_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = data ?? [];
  }

  const todayList = notifications.filter((n) => isToday(n.created_at));
  const prevList = notifications.filter((n) => !isToday(n.created_at));
  const hasUnread = notifications.some((n) => !n.is_read);

  async function handleMarkAllRead() {
    "use server";
    const result = await markAllNotificationsRead();
    if (result?.error) {
      console.error("모두 읽음 처리 실패:", result.error.message);
    }
    revalidatePath("/notifications");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-orange-50 min-h-screen">
        <div className="max-w-[720px] mx-auto px-6 pt-12 pb-20">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-xl border border-orange-100 flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft size={20} className="text-stone-900" />
              </Link>
              <div>
                <h1 className="text-stone-900 text-2xl font-bold leading-8">알림</h1>
                <p className="text-gray-500 text-sm mt-1">새로운 소식을 확인하세요</p>
              </div>
            </div>
            {hasUnread && (
              <form action={handleMarkAllRead}>
                <button
                  type="submit"
                  className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors"
                >
                  모두 읽음 처리
                </button>
              </form>
            )}
          </div>

          {/* 알림 없음 */}
          {notifications.length === 0 && (
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                <Bell size={28} strokeWidth={1.5} />
                <p className="text-sm">아직 알림이 없어요</p>
              </div>
            </div>
          )}

          {/* 오늘 알림 */}
          {todayList.length > 0 && (
            <div className="mb-6">
              <p className="px-1 text-gray-500 text-xs uppercase tracking-tight mb-3">오늘</p>
              <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
                {todayList.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    type={n.type}
                    title={n.title}
                    content={n.content}
                    time={formatRelativeTime(n.created_at)}
                    isRead={n.is_read}
                    linkUrl={n.link_url}
                    last={i === todayList.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 이전 알림 */}
          {prevList.length > 0 && (
            <div>
              <p className="px-1 text-gray-500 text-xs uppercase tracking-tight mb-3">이전 알림</p>
              <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
                {prevList.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    type={n.type}
                    title={n.title}
                    content={n.content}
                    time={formatRelativeTime(n.created_at)}
                    isRead={n.is_read}
                    linkUrl={n.link_url}
                    last={i === prevList.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
