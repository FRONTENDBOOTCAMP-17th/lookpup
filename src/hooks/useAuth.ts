"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoggedIn: !!user };
}
