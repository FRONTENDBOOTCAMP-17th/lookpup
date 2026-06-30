import { Suspense } from "react";
import BookingHistoryClient from "@/components/myprofile/BookingHistoryClient";

export default function BookingHistoryPage() {
  return (
    <Suspense>
      <BookingHistoryClient />
    </Suspense>
  );
}
