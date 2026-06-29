import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const db = createServiceClient();
  const { data: userRow } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (userRow?.role !== "admin") redirect("/");

  return <>{children}</>;
}
