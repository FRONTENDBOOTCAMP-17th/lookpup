import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isUserVerified } from "@/utils/supabase/service";
import { getMySitterProfile } from "@/app/actions/sitters";
import SitterRegisterClient from "@/components/sitter-register/SitterRegisterClient";

export default async function PetsitterRegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  if (!(await isUserVerified(user.id))) redirect("/auth/verification");

  const { data: sitter } = await getMySitterProfile();
  if (sitter) redirect("/myprofile");

  return <SitterRegisterClient />;
}
