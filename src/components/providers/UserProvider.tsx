"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { getMySitterProfile } from "@/app/actions/sitters";

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setSitter, clearUser, setDeletedAccount, isDeletedAccount } = useUserStore();

  useEffect(() => {
    if (isDeletedAccount && pathname !== "/auth/restore") {
      router.replace("/auth/restore");
    }
  }, [isDeletedAccount, pathname, router]);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, phone_number, profile_image, is_verified, role, deleted_at")
        .eq("id", userId)
        .single();

      if (!data) {
        clearUser();
        return;
      }

      if (data.deleted_at) {
        setDeletedAccount();
        return;
      }

      setUser({
        id: data.id,
        email: data.email ?? "",
        fullName: data.full_name ?? "",
        phoneNumber: data.phone_number ?? "",
        profileImage: data.profile_image ?? null,
        isVerified: data.is_verified ?? false,
        role: data.role ?? "owner",
      });

      if (data.role === "both" || data.role === "admin") {
        const result = await getMySitterProfile();
        if ("data" in result && result.data) {
          setSitter(result.data);
        }
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
  }, [setUser, clearUser, setDeletedAccount]);

  return <>{children}</>;
}
