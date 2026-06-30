"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Props = {
  userId: string;
  onSync: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
};

export function NotificationsRealtimeSync({ userId, onSync }: Props) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notifications-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        onSync,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onSync]);

  return null;
}
