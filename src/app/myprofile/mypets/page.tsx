import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import MyPetsClient, { type PetRow } from "@/components/myprofile/MyPetsClient";

export default async function MyPetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialPets: PetRow[] = [];

  if (user) {
    const db = createServiceClient();
    const { data } = await db
      .from("pets")
      .select("id, name, animal_type, breed, age, gender, weight, image_url, caution")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    initialPets = (data ?? []) as PetRow[];
  }

  return <MyPetsClient initialPets={initialPets} />;
}
