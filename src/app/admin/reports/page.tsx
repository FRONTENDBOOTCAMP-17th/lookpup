import { createServiceClient } from "@/utils/supabase/service";
import AdminReportsClient from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const db = createServiceClient();

  const { data: reports } = await db
    .from("reports")
    .select(
      `id, reporter_id, target_type, target_id, reason, content, status,
       image_urls, admin_memo, handled_by, handled_at, created_at, updated_at,
       reporter:users!reports_reporter_id_fkey(id, full_name, profile_image, email)`
    )
    .order("created_at", { ascending: false });

  return <AdminReportsClient initialReports={reports ?? []} />;
}
