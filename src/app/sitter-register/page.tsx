import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getMySitterProfile } from "@/app/actions/sitters";
import SitterRegisterClient from "@/components/sitter-register/SitterRegisterClient";

export default async function PetsitterRegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: sitter } = await getMySitterProfile();
  if (sitter) redirect("/myprofile");

  return <SitterRegisterClient />;
}
