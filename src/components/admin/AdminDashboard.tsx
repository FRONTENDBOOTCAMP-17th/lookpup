"use client";

import { useState } from "react";
import { Flag, CalendarClock } from "lucide-react";
import AdminReportsClient, { type AdminReportsClientProps } from "@/components/admin/AdminReportsClient";
import AdminStateClient from "@/components/admin/AdminStateClient";

type Tab = "reports" | "state";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "reports", label: "신고 관리", icon: <Flag className="w-4 h-4" /> },
  { key: "state", label: "예약 상태 관리", icon: <CalendarClock className="w-4 h-4" /> },
];

interface AdminDashboardProps {
  initialReports: AdminReportsClientProps["initialReports"];
  initialReservations: React.ComponentProps<typeof AdminStateClient>["initialReservations"];
}

export default function AdminDashboard({
  initialReports,
  initialReservations,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("reports");

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pt-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl border-x border-t transition-colors ${
                  isActive
                    ? "bg-stone-50 border-stone-200 text-orange-600"
                    : "bg-transparent border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "reports" && (
        <AdminReportsClient initialReports={initialReports} />
      )}
      {activeTab === "state" && (
        <AdminStateClient initialReservations={initialReservations} />
      )}
    </div>
  );
}
