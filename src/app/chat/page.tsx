import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getChatRoomsData } from "@/app/actions/chat";
import ChatClient from "@/components/chat/ChatClient";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const roomsResult = await getChatRoomsData();

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-orange-50">
          <p className="text-stone-400 text-sm">불러오는 중...</p>
        </div>
      }
    >
      <ChatClient initialRoomsData={roomsResult.data} />
    </Suspense>
  );
}
