import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function isUserVerified(userId: string) {
  const { data } = await createServiceClient()
    .from("users")
    .select("is_verified")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return data?.is_verified ?? false;
}
