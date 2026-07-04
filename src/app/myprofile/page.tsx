import { getServerUser } from "@/utils/supabase/serverUser";
import { createServiceClient } from "@/utils/supabase/service";
import { getMySitterProfile } from "@/app/actions/sitters";
import MyProfileClient from "@/components/myprofile/MyProfileClient";
import type { UserProfile, SitterData } from "@/store/userStore";

export default async function MyProfilePage() {
  const { data: { user: authUser } } = await getServerUser();

  if (!authUser) return <MyProfileClient />;

  const db = createServiceClient();

  const [userResult, sitterResult] = await Promise.all([
    db
      .from("users")
      .select(
        "id, email, full_name, phone_number, address, display_area, latitude, longitude, birthdate, profile_image, is_verified, role, deleted_at",
      )
      .eq("id", authUser.id)
      .single(),
    getMySitterProfile(),
  ]);

  const row = userResult.data;
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
  if ((row.role === "both" || row.role === "admin") && "data" in sitterResult && sitterResult.data) {
    initialSitter = sitterResult.data;
  }

  return <MyProfileClient initialUser={initialUser} initialSitter={initialSitter} />;
}
