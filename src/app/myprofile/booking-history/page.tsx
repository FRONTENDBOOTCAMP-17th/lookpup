import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { getMyReservations, getMySitterReservations } from "@/app/actions/reservations";
import { getMySitterApplications } from "@/app/actions/applications";
import BookingHistoryClient, {
  type Booking,
  type Application,
} from "@/components/myprofile/BookingHistoryClient";

export default async function BookingHistoryPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return (
      <Suspense>
        <BookingHistoryClient />
      </Suspense>
    );
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const isSitter = userRow?.role === "both" || userRow?.role === "admin";

  const [ownerResult, sitterResult, appResult] = await Promise.all([
    getMyReservations(),
    isSitter ? getMySitterReservations() : Promise.resolve({ data: [] as Booking[] }),
    isSitter ? getMySitterApplications() : Promise.resolve({ data: [] as Application[] }),
  ]);

  return (
    <Suspense>
      <BookingHistoryClient
        initialOwnerBookings={(ownerResult.data ?? []) as Booking[]}
        initialSitterBookings={(sitterResult.data ?? []) as Booking[]}
        initialSitterApplications={(appResult.data ?? []) as Application[]}
        initialIsSitter={isSitter}
      />
    </Suspense>
  );
}
