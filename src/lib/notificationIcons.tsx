import type { ReactNode } from "react";
import {
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  FileText,
  MessageSquare,
  XCircle,
} from "lucide-react";

export function getNotificationIcon(
  type: string,
  size = 16,
): { icon: ReactNode; iconBg: string } {
  switch (type) {
    case "application":
      return { icon: <Calendar size={size} className="text-orange-500" />, iconBg: "bg-orange-50" };
    case "application_selected":
      return { icon: <CheckCircle size={size} className="text-green-700" />, iconBg: "bg-green-100" };
    case "application_rejected":
      return { icon: <XCircle size={size} className="text-red-500" />, iconBg: "bg-red-50" };
    case "reservation":
      return { icon: <CalendarCheck size={size} className="text-indigo-600" />, iconBg: "bg-indigo-50" };
    case "care_record":
      return { icon: <ClipboardList size={size} className="text-teal-600" />, iconBg: "bg-teal-50" };
    case "message":
      return { icon: <MessageSquare size={size} className="text-sky-600" />, iconBg: "bg-sky-100" };
    case "review":
    case "review_received":
      return { icon: <FileText size={size} className="text-purple-800" />, iconBg: "bg-pink-100" };
    default:
      return { icon: <Bell size={size} className="text-orange-500" />, iconBg: "bg-orange-50" };
  }
}
