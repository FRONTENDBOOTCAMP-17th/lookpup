import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, bank_name, account_number, account_holder")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
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

  const body = await req.json();
  const { bank_name, account_number, account_holder } = body;

  if (!bank_name || !account_number || !account_holder) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "모든 필드를 입력해주세요." } },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("bank_accounts")
    .upsert(
      { user_id: user.id, bank_name, account_number, account_holder, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("id, bank_name, account_number, account_holder")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
