import { redirect } from "next/navigation";
import { getServerUser } from "@/utils/supabase/serverUser";

export default async function MyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getServerUser();

  if (!user) redirect("/auth/login");

  return <>{children}</>;
}
