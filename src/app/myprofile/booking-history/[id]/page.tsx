import { getReservationById } from "@/app/actions/reservations";
import BookingDetailClient, { type Booking } from "@/components/myprofile/BookingDetailClient";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getReservationById(id);
  const initialBooking =
    "data" in result && result.data ? (result.data as unknown as Booking) : null;

  return <BookingDetailClient id={id} initialBooking={initialBooking} />;
}
