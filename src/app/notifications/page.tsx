import Link from "next/link";
import { ChevronLeft, Calendar, MessageSquare, CheckCircle, FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

//임시 더미데이터
//추후 각 데이터에 따른 페이지 연동 필요!
const TODAY_NOTIFICATIONS = [
  {
    id: 1,
    title: "예약 지원이 도착했어요",
    body: "박지현 님이 방문돌봄에 지원했습니다.",
    time: "5분 전",
    unread: true,
    icon: <Calendar size={16} className="text-orange-500" />,
    iconBg: "bg-orange-50",
  },
  {
    id: 2,
    title: "새로운 메시지가 왔어요",
    body: "이지현: 안녕하세요! 일정 조율 가능할까요?",
    time: "23분 전",
    unread: true,
    icon: <MessageSquare size={16} className="text-sky-600" />,
    iconBg: "bg-sky-100",
  },
  {
    id: 3,
    title: "예약이 승인되었어요",
    body: "6월 21일 산책 서비스가 확정되었습니다.",
    time: "1시간 전",
    unread: true,
    icon: <CheckCircle size={16} className="text-green-700" />,
    iconBg: "bg-green-100",
  },
  {
    id: 4,
    title: "후기를 남겨주세요",
    body: "방문돌봄 서비스 후기를 작성해주세요.",
    time: "2시간 전",
    unread: false,
    icon: <FileText size={16} className="text-purple-800" />,
    iconBg: "bg-pink-100 opacity-70",
  },
];

const PREV_NOTIFICATIONS = [
  {
    id: 5,
    title: "예약이 완료되었어요",
    body: "5월 20일 위탁돌봄 서비스가 완료되었습니다.",
    time: "1일 전",
    icon: <CheckCircle size={16} className="text-green-600" />,
    iconBg: "bg-green-50 opacity-70",
  },
  {
    id: 6,
    title: "예약 신청 알림",
    body: "김민지 펫시터에게 예약을 신청했습니다.",
    time: "2일 전",
    icon: <Calendar size={16} className="text-orange-500" />,
    iconBg: "bg-orange-50 opacity-70",
  },
  {
    id: 7,
    title: "새로운 메시지가 왔어요",
    body: "박준호: 도착했습니다! 몽이가 잘 있어요 😊",
    time: "3일 전",
    icon: <MessageSquare size={16} className="text-sky-600" />,
    iconBg: "bg-sky-100 opacity-70",
  },
];

function NotificationItem({
  title,
  body,
  time,
  unread,
  icon,
  iconBg,
  last,
}: {
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  last?: boolean;
}) {
  return (
    <div className={`relative px-5 py-4 flex items-start gap-3 hover:bg-orange-50/40 transition-colors cursor-pointer ${!last ? "border-b border-orange-100" : ""}`}>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-5 ${unread ? "text-stone-900" : "text-gray-500"}`}>{title}</p>
        <p className="text-xs text-gray-500 leading-4 mt-0.5 truncate">{body}</p>
        <p className="text-xs text-gray-400 leading-4 mt-1">{time}</p>
      </div>
      {unread && (
        <span className="absolute left-2 top-[43px] w-1.5 h-1.5 bg-orange-500 rounded-full" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
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
            <button className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors">
              모두 읽음 처리
            </button>
          </div>

          {/* 오늘 알림 */}
          <div className="mb-6">
            <p className="px-1 text-gray-500 text-xs uppercase tracking-tight mb-3">오늘</p>
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              {TODAY_NOTIFICATIONS.map((n, i) => (
                <NotificationItem
                  key={n.id}
                  {...n}
                  last={i === TODAY_NOTIFICATIONS.length - 1}
                />
              ))}
            </div>
          </div>

          {/* 이전 알림 */}
          <div>
            <p className="px-1 text-gray-500 text-xs uppercase tracking-tight mb-3">이전 알림</p>
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              {PREV_NOTIFICATIONS.map((n, i) => (
                <NotificationItem
                  key={n.id}
                  {...n}
                  last={i === PREV_NOTIFICATIONS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
