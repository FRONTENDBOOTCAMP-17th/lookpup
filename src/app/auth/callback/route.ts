import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const db = createServiceClient();
        const { data: existingUser } = await db
          .from("users")
          .select("is_verified, deleted_at")
          .eq("id", user.id)
          .maybeSingle();

        if (existingUser?.deleted_at)
          return NextResponse.redirect(`${origin}/auth/restore`);

        if (existingUser?.is_verified)
          return NextResponse.redirect(`${origin}${next}`);

        if (!existingUser) {
          const { error: insertError } = await db.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            provider: user.app_metadata.provider ?? "google",
            profile_image:
              user.user_metadata?.avatar_url ??
              user.user_metadata?.picture ??
              "",
            role: "owner",
            is_verified: false,
          });
          if (insertError) console.error("[auth/callback] users INSERT 실패:", insertError);
        }

        return NextResponse.redirect(`${origin}/auth/verification`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
