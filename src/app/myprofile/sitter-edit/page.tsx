import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { getMySitterProfile, getSitterServices } from "@/app/actions/sitters";
import SitterEditClient from "@/components/myprofile/SitterEditClient";

export default async function SitterEditPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return <SitterEditClient />;

  const db = createServiceClient();
  const [{ data: userRow }, profileResult] = await Promise.all([
    db
      .from("users")
      .select("full_name, profile_image")
      .eq("id", authUser.id)
      .single(),
    getMySitterProfile(),
  ]);

  if (!userRow || !("data" in profileResult) || !profileResult.data) {
    return <SitterEditClient />;
  }

  const { data: services } = await getSitterServices(profileResult.data.id);

  return (
    <SitterEditClient
      initialProfile={{
        user: { fullName: userRow.full_name ?? "", profileImage: userRow.profile_image ?? null },
        sitter: profileResult.data,
      }}
      initialServices={services}
    />
  );
}
