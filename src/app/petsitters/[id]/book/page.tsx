import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BookingClient from "@/components/petsitters/BookingClient";

export default async function BookPage({
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

  return <BookingClient sitterId={id} />;
}
