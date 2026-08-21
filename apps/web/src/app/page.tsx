import { connection } from "next/server";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { fetchAnalyticsOverview } from "@/features/dashboard/fetchers";

export default async function HomePage() {
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
