import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import BoardEditClient from "@/components/board/BoardEditClient";
import { mapPetRow } from "@/lib/board";
import type { PetRow } from "@/types/board";

export default async function BoardEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const db = createServiceClient();

  const [{ data: post }, { data: petsData }] = await Promise.all([
    db
      .from("requests")
      .select("id, status, request_type, budget, start_datetime, end_datetime, content, location, latitude, longitude, title, pets!pet_id(id)")
      .eq("id", id)
      .single(),
    db
      .from("pets")
      .select("id, name, animal_type, breed, age, gender, weight, image_url, caution")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const initialPets = (petsData ?? []).map((p) => mapPetRow(p as unknown as PetRow));

  return (
    <BoardEditClient
      id={id}
      initialData={post as any}
      initialPets={initialPets}
    />
  );
}
