import type { Metadata } from "next";
import { connection } from "next/server";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { fetchAnalyticsOverview } from "@/features/dashboard/fetchers";

export const metadata: Metadata = {
  description:
    "Executive recovery dashboard for revenue at risk, policy-controlled actions, and simulated incremental recovery.",
  title: "Dashboard",
};

export default async function DashboardPage() {
  await connection();
  const overview = await fetchAnalyticsOverview();

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Revenue recovery control room</p>
          <h1 className="page-title">
            <span>Recover more.</span>
            <br />
            <span className="title-accent">Intervene less.</span>
          </h1>
          <p className="page-description">
            A live, explainable view of failed payments, policy-controlled
            recovery actions, and the revenue Aurora Retail wins back.
          </p>
        </div>
      </header>
      <DashboardOverview overview={overview} />
    </div>
  );
}
