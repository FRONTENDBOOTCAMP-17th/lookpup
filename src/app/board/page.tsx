import { Suspense } from "react";
import BoardListClient from "@/components/board/BoardListClient";

export default function BoardPage() {
  return (
    <Suspense>
      <BoardListClient />
    </Suspense>
  );
}
