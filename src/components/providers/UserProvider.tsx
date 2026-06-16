"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, phone_number, is_verified")
        .eq("id", userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          email: data.email ?? "",
          fullName: data.full_name ?? "",
          phoneNumber: data.phone_number ?? "",
          isVerified: data.is_verified ?? false,
        });
      } else {
        clearUser();
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUser(user.id);
      else clearUser();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser]);

  return <>{children}</>;
}
