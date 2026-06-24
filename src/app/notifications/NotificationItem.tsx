"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Calendar,
  MessageSquare,
  CheckCircle,
  FileText,
  Bell,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { markNotificationRead } from "@/app/actions/notifications";

type Props = {
  id: string;
  type: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  linkUrl: string | null;
  last?: boolean;
};

function getNotificationIcon(type: string): { icon: React.ReactNode; iconBg: string } {
  switch (type) {
    case "application":
      return { icon: <Calendar size={16} className="text-orange-500" />, iconBg: "bg-orange-50" };
    case "application_selected":
      return { icon: <CheckCircle size={16} className="text-green-700" />, iconBg: "bg-green-100" };
    case "application_rejected":
      return { icon: <XCircle size={16} className="text-red-500" />, iconBg: "bg-red-50" };
    case "care_record":
      return { icon: <ClipboardList size={16} className="text-teal-600" />, iconBg: "bg-teal-50" };
    case "message":
      return { icon: <MessageSquare size={16} className="text-sky-600" />, iconBg: "bg-sky-100" };
    case "review":
      return { icon: <FileText size={16} className="text-purple-800" />, iconBg: "bg-pink-100" };
    default:
      return { icon: <Bell size={16} className="text-orange-500" />, iconBg: "bg-orange-50" };
  }
}

export function NotificationItem({ id, type, title, content, time, isRead, linkUrl, last }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { icon, iconBg } = getNotificationIcon(type);

  function handleClick() {
    startTransition(async () => {
      if (!isRead) {
        const result = await markNotificationRead(id);
        if (result?.error) {
          console.error("알림 읽음 처리 실패:", result.error.message);
        }
      }
      if (linkUrl) {
        router.push(linkUrl);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`relative px-5 py-4 flex items-start gap-3 hover:bg-orange-50/40 transition-colors cursor-pointer ${
        !last ? "border-b border-orange-100" : ""
      } ${isRead ? "bg-white/60" : "bg-white"}`}
    >
      <div
        className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? "opacity-70" : ""
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-5 ${isRead ? "text-gray-500" : "text-stone-900 font-medium"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500 leading-4 mt-0.5 truncate">{content}</p>
        <p className="text-xs text-gray-400 leading-4 mt-1">{time}</p>
      </div>
      {!isRead && (
        <span className="absolute left-2 top-[43px] w-1.5 h-1.5 bg-orange-500 rounded-full" />
      )}
    </div>
  );
}
