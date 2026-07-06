import { getAdminReports, getAdminReservations, getAdminSitters } from "@/app/actions/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const [reportsResult, reservationsResult, sittersResult] = await Promise.all([
    getAdminReports(),
    getAdminReservations(),
    getAdminSitters(),
  ]);

  return (
    <AdminDashboard
      initialReports={reportsResult.data ?? []}
      initialReservations={reservationsResult.data ?? []}
      initialSitters={sittersResult.data ?? []}
    />
  );
}
