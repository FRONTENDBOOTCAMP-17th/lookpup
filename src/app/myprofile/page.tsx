import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { getMySitterProfile } from "@/app/actions/sitters";
import MyProfileClient from "@/components/myprofile/MyProfileClient";
import type { UserProfile, SitterData } from "@/store/userStore";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return <MyProfileClient />;

  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select(
      "id, email, full_name, phone_number, address, display_area, latitude, longitude, birthdate, profile_image, is_verified, role, deleted_at",
    )
    .eq("id", authUser.id)
    .single();

  if (!row || row.deleted_at) return <MyProfileClient />;

  const initialUser: UserProfile = {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    phoneNumber: row.phone_number ?? "",
    address: row.address ?? "",
    displayArea: row.display_area ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    birthdate: row.birthdate ?? null,
    profileImage: row.profile_image ?? null,
    isVerified: row.is_verified ?? false,
    role: (row.role ?? "owner") as "owner" | "both" | "admin",
  };

  let initialSitter: SitterData | null = null;
  if (row.role === "both" || row.role === "admin") {
    const result = await getMySitterProfile();
    if ("data" in result && result.data) initialSitter = result.data;
  }

  return <MyProfileClient initialUser={initialUser} initialSitter={initialSitter} />;
}
