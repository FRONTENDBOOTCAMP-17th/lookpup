import { getAdminReports, getAdminReservations } from "@/app/actions/admin";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const [reportsResult, reservationsResult] = await Promise.all([
    getAdminReports(),
    getAdminReservations(),
  ]);

  return (
    <AdminDashboard
      initialReports={reportsResult.data ?? []}
      initialReservations={reservationsResult.data ?? []}
    />
  );
}
