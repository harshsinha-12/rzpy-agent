import type { Metadata } from "next";
import { connection } from "next/server";
import { RecoveryWorkbench } from "@/features/extended-recovery/components/recovery-workbench";
import { fetchExtendedRecoveryCases } from "@/features/extended-recovery/fetchers";

export const metadata: Metadata = { title: "Recovery workbench" };

export default async function RecoveryToolsPage() {
  await connection();
  const { data } = await fetchExtendedRecoveryCases();
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Expanded recovery</p>
          <h1 className="page-title">
            Recovery <span className="title-accent">workbench.</span>
          </h1>
          <p className="page-description">
            Persisted, policy-bounded workflows. Drafts and voice scripts are
            previews only; RecoveryOS does not send email or place calls.
          </p>
        </div>
      </header>
      <RecoveryWorkbench cases={data} />
    </div>
  );
}
