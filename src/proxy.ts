import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/utils/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/myprofile",
  "/payment",
  "/chat",
  "/notifications",
  "/pet-register",
  "/sitter-register",
  "/admin",
];

function isProtected(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith("/petsitters")) return pathname.includes("/book");
  if (pathname.startsWith("/board")) {
    return pathname.startsWith("/board/write") || pathname.endsWith("/edit");
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 로그인 상태에서 로그인 페이지 접근 시 홈으로
  if (user && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 비로그인 상태에서 보호된 경로 접근 시 로그인으로
  if (!user && isProtected(pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 어드민 역할 체크
  if (user && pathname.startsWith("/admin")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
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

  // 정지된 유저 차단 (/suspended, /admin, /auth 제외)
  const isExcluded =
    pathname.startsWith("/suspended") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth");

  if (user && !isExcluded) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
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

