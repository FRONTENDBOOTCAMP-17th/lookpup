import { cache } from "react";
import { createClient } from "./server";

export const getServerUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
