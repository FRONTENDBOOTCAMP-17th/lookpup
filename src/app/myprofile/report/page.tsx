import { Suspense } from "react";
import ReportClient from "@/components/myprofile/ReportClient";

export default function ReportPage() {
  return (
    <Suspense>
      <ReportClient />
    </Suspense>
  );
}
