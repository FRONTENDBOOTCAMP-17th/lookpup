import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .is("deleted_at", null)
      .single();

    if (userRow?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 정지된 유저 차단 (/suspended, /admin, 정적 리소스 제외)
  const pathname = request.nextUrl.pathname;
  const isExcluded =
    pathname.startsWith("/suspended") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth");

  if (user && !isExcluded) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: userRow } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("id", user.id)
      .single();

    if (userRow?.suspended_until && new Date(userRow.suspended_until) > new Date()) {
      const url = new URL("/suspended", request.url);
      url.searchParams.set("until", userRow.suspended_until);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
