import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("reviews")
    .select(
      `id, rating, content, created_at,
       sitters(
         users(full_name, profile_image)
       )`,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  const reviews = data.map((item) => {
    return {
      id: item.id,
      rating: item.rating,
      content: item.content,
      created_at: item.created_at,
      sitter_full_name: item.sitters?.users?.full_name ?? "알 수 없음",
      sitter_profile_image: item.sitters?.users?.profile_image ?? null,
    };
  });

  return NextResponse.json({ data: reviews });
}
