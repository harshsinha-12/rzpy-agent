import type { Metadata } from "next";
import { connection } from "next/server";

import { Pagination } from "@/features/recoveries/components/pagination";
import { RecoveryFilters } from "@/features/recoveries/components/recovery-filters";
import { RecoveryTable } from "@/features/recoveries/components/recovery-table";
import { fetchRecoveryCases } from "@/features/recoveries/fetchers";
import {
  parseRecoveryQuery,
  type RawSearchParams,
} from "@/features/recoveries/query";

export const metadata: Metadata = {
  description:
    "Search and investigate failed payments and their recovery state.",
  title: "Reported issues",
};

export default async function RecoveriesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await connection();
  const query = parseRecoveryQuery(await searchParams);
  const response = await fetchRecoveryCases(query);

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Reported issues</p>
          <h1 className="page-title">
            Every failed payment,
            <br />
            <span className="title-accent">one clear state.</span>
          </h1>
          <p className="page-description">
            Search payment failures, inspect the proposed recovery strategy, and
            open any case for its complete decision trail.
          </p>
        </div>
      </header>
      <RecoveryFilters query={query} />
      <RecoveryTable items={response.data} query={query} />
      <Pagination meta={response.meta} query={query} />
    </div>
  );
}
