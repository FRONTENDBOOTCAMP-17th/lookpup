import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("users")
    .select("id, email, full_name, profile_image, role, is_verified, created_at")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." } },
      { status: 404 },
    );
  }

  const { data: sitterProfile } = await db
    .from("sitters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    data: {
      ...data,
      has_sitter_profile: !!sitterProfile,
      sitter_id: sitterProfile?.id ?? null,
    },
  });
}
