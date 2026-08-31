import type { Metadata } from "next";
import { connection } from "next/server";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchExtendedRecoveryCases } from "@/features/extended-recovery/fetchers";
import { VoicePreview } from "@/features/extended-recovery/components/voice-preview";
import { formatMoney } from "@/lib/formatters";

export const metadata: Metadata = { title: "Recovery workbench" };

const labels = {
  SUBSCRIPTION: "Failed subscriptions",
  RECEIVABLE: "B2B receivables",
  MANDATE: "Mandate sequencing",
  VOICE: "Voice recovery",
  UDHAAR: "Udhaar promises",
} as const;

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
      <section className="surface">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Case</th>
                <th>Customer</th>
                <th>Amount / due</th>
                <th>State</th>
                <th>Policy-safe next step</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.publicId}>
                  <td>
                    <strong>{labels[item.kind]}</strong>
                  </td>
                  <td>{item.reference}</td>
                  <td>{item.customer.name}</td>
                  <td>
                    {formatMoney(item.amountPaise, item.currency)}
                    {item.dueAt ? (
                      <>
                        <br />
                        <span className="muted">
                          Due{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                          }).format(new Date(item.dueAt))}
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td>
                    <StatusBadge value={item.status} />
                  </td>
                  <td>
                    <p>{item.reason}</p>
                    {item.draftSubject ? (
                      <details>
                        <summary>Preview email</summary>
                        <pre>
                          {item.draftSubject}
                          {"\n\n"}
                          {item.draftBody}
                        </pre>
                      </details>
                    ) : null}
                    {item.voiceScript ? (
                      <>
                        <details>
                          <summary>Preview Hinglish voice script</summary>
                          <p>{item.voiceScript}</p>
                        </details>
                        <VoicePreview caseId={item.publicId} />
                      </>
                    ) : null}
                    <DataSourceBadge source={item.dataSource} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 ? (
          <p className="empty-message">
            No expanded recovery cases yet. Seeded cases will be clearly marked
            SIMULATED.
          </p>
        ) : null}
      </section>
    </div>
  );
}
