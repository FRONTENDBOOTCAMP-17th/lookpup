import { getAdminReservations } from "@/app/actions/admin";
import AdminStateClient from "./AdminStateClient";

export default async function AdminStatePage() {
  const { data: reservations } = await getAdminReservations();
  return <AdminStateClient initialReservations={reservations ?? []} />;
}
