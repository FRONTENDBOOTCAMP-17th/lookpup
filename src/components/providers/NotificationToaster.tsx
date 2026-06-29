"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";

/**
 * 새 알림(notifications INSERT/UPDATE) 수신 시 토스트로 띄우는 전역 컴포넌트.
 * 렌더링 결과는 없고(layout의 <Toaster />가 실제 토스트를 그림) 구독만 담당한다.
 */
export default function NotificationToaster() {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useUserStore((s) => s.user?.id);

  // 채팅 화면 여부 판단용 — 재구독 없이 콜백에서 최신 경로를 읽기 위해 ref로 보관
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`toast-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as {
            type: string;
            title: string;
            content: string;
            link_url: string | null;
            is_read: boolean;
          };
          // 읽음 처리 등 안 읽은 새 알림이 아닌 변경은 토스트하지 않음
          if (row.is_read) return;
          // 채팅 화면을 보고 있을 때는 채팅 알림만 토스트하지 않음
          const isChatType =
            row.type === "message" || row.type === "chat_message";
          if (isChatType && pathnameRef.current.startsWith("/chat")) return;
          // 고정 id로 호출 → 새 알림이 오면 이전 토스트를 쌓지 않고 교체(항상 최신 1개만 표시)
          toast(row.title, {
            id: "app-notification",
            description: row.content,
            action: row.link_url
              ? {
                  label: "보기",
                  onClick: () => router.push(row.link_url as string),
                }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
