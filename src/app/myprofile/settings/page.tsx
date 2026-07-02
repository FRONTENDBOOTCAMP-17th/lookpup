import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import SettingsClient from "@/components/myprofile/SettingsClient";
import type { UserProfile } from "@/store/userStore";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return <SettingsClient />;

  const db = createServiceClient();
  const [{ data: row }, { data: bankAccountData }] = await Promise.all([
    db
      .from("users")
      .select(
        "id, email, full_name, phone_number, address, display_area, latitude, longitude, birthdate, profile_image, is_verified, role",
      )
      .eq("id", authUser.id)
      .single(),
    db
      .from("bank_accounts")
      .select("id, bank_name, account_number, account_holder")
      .eq("user_id", authUser.id)
      .maybeSingle(),
  ]);

  if (!row) return <SettingsClient />;

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

  return (
    <SettingsClient
      initialUser={initialUser}
      initialBankAccount={bankAccountData ?? null}
    />
  );
}
