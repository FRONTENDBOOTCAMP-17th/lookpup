// 알림 설정 토글은 DB에 저장할 곳이 없어 브라우저(localStorage)에만 저장한다.
// "수신자 본인이 본인 화면의 배지를 보는" 상황에만 쓰이므로 클라이언트 저장으로 충분하다.
export const NOTIFICATION_PREFS_STORAGE_KEY = "lookpup_notification_prefs";

export type NotificationCategory =
  | "all"
  | "reservation"
  | "chat"
  | "review"
  | "marketing";

export interface NotificationPrefs {
  all: boolean;
  reservation: boolean;
  chat: boolean;
  review: boolean;
  marketing: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  all: true,
  reservation: true,
  chat: true,
  review: true,
  marketing: false,
};

// notifications.type 값 → 설정 카테고리 매핑
// "마케팅 알림"은 실제로 발행되는 type이 없어 항상 무효(영향 없음)
const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  application: "reservation",
  application_selected: "reservation",
  application_rejected: "reservation",
  reservation_requested: "reservation",
  reservation_accepted: "reservation",
  reservation_rejected: "reservation",
  reservation_completed: "reservation",
  reservation_canceled: "reservation",
  care_record: "reservation",
  message: "chat",
  chat_message: "chat",
  review_received: "review",
};

export function getNotificationCategory(
  type: string,
): NotificationCategory | null {
  return TYPE_TO_CATEGORY[type] ?? null;
}

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
