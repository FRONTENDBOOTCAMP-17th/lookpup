"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { getMySitterProfile } from "@/app/actions/sitters";

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setUser, setSitter, clearUser, setDeletedAccount, isDeletedAccount } =
    useUserStore();

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
        .select(
          "id, email, full_name, phone_number, address, display_area, latitude, longitude, birthdate, profile_image, is_verified, role, deleted_at",
        )
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
        address: data.address ?? "",
        displayArea: data.display_area ?? null,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        birthdate: data.birthdate ?? null,
        profileImage: data.profile_image ?? null,
        isVerified: data.is_verified ?? false,
        role: (data.role ?? "owner") as "owner" | "both" | "admin",
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.invalidateQueries({ queryKey: ["sitter"] });
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, setDeletedAccount, queryClient]);

  return <>{children}</>;
}
