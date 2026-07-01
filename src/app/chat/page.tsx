import { Suspense } from "react";
import ChatClient from "@/components/chat/ChatClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-orange-50">
          <p className="text-stone-400 text-sm">불러오는 중...</p>
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
