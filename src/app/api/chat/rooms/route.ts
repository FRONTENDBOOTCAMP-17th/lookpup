import { NextResponse } from "next/server";
import { getChatRoomsData } from "@/app/actions/chat";

const STATUS_BY_CODE: Record<string, number> = {
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
};

export async function GET() {
  const result = await getChatRoomsData();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: STATUS_BY_CODE[result.error.code] ?? 500 },
    );
  }

  return NextResponse.json({ data: result.data });
}
