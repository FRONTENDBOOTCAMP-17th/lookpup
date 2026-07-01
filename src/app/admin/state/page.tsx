import { getAdminReservations } from "@/app/actions/admin";
import AdminStateClient from "@/components/admin/AdminStateClient";

export default async function AdminStatePage() {
  const { data: reservations } = await getAdminReservations();
  return <AdminStateClient initialReservations={reservations ?? []} />;
}
