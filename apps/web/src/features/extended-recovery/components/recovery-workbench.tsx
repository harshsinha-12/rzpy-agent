import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/formatters";

import type { ExtendedRecoveryCase } from "../schemas";
import styles from "./recovery-workbench.module.css";
import { VoicePreview } from "./voice-preview";

const labels = {
  MANDATE: "Mandate sequencing",
  RECEIVABLE: "B2B receivables",
  SUBSCRIPTION: "Failed subscriptions",
  UDHAAR: "Udhaar promises",
  VOICE: "Voice recovery",
} as const;

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function RecoveryCaseCard({ item }: { item: ExtendedRecoveryCase }) {
  const hasPreview = Boolean(item.draftSubject || item.voiceScript);

  return (
    <article className={styles.card} data-kind={item.kind}>
      <header className={styles.cardHeader}>
        <div>
          <span className={styles.trackLabel}>{labels[item.kind]}</span>
          <h2>{item.customer.name}</h2>
        </div>
        <StatusBadge value={item.status} />
      </header>

      <dl className={styles.caseFacts}>
        <div>
          <dt>Case reference</dt>
          <dd>{item.reference}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{formatMoney(item.amountPaise, item.currency)}</dd>
        </div>
        <div>
          <dt>{item.dueAt ? "Due date" : "Source"}</dt>
          <dd>
            {item.dueAt ? (
              formatDueDate(item.dueAt)
            ) : (
              <DataSourceBadge source={item.dataSource} />
            )}
          </dd>
        </div>
      </dl>

      <section className={styles.nextStep} aria-label="Policy-safe next step">
        <span>Policy-safe next step</span>
        <p>{item.reason}</p>
      </section>

      {hasPreview ? (
        <div className={styles.previews}>
          {item.draftSubject ? (
            <details className={styles.preview}>
              <summary>
                <span>Preview recovery email</span>
                <small>Draft only</small>
              </summary>
              <div className={styles.previewBody}>
                <strong>{item.draftSubject}</strong>
                <p>{item.draftBody}</p>
              </div>
            </details>
          ) : null}

          {item.voiceScript ? (
            <details className={styles.preview}>
              <summary>
                <span>Preview Hinglish voice script</span>
                <small>Generated, not sent</small>
              </summary>
              <div className={styles.previewBody}>
                <p>{item.voiceScript}</p>
              </div>
            </details>
          ) : null}

          {item.voiceScript ? <VoicePreview caseId={item.publicId} /> : null}
        </div>
      ) : (
        <p className={styles.noPreview}>
          Awaiting merchant review before a draft or action is prepared.
        </p>
      )}

      <footer className={styles.cardFooter}>
        <DataSourceBadge source={item.dataSource} />
        <span>No email sent · no call placed</span>
      </footer>
    </article>
  );
}

export function RecoveryWorkbench({
  cases,
}: {
  cases: ExtendedRecoveryCase[];
}) {
  if (cases.length === 0) {
    return (
      <section className={`surface ${styles.empty}`}>
        <span>0 active workflows</span>
        <h2>No expanded recovery cases yet.</h2>
        <p>
          Seeded cases will appear here and remain clearly marked SIMULATED.
        </p>
      </section>
    );
  }

  const draftCount = cases.filter(
    (item) => item.status === "DRAFT_READY",
  ).length;

  return (
    <section aria-label="Expanded recovery cases" className={styles.workbench}>
      <div className={styles.summary}>
        <div>
          <span>Active workflows</span>
          <strong>{cases.length}</strong>
        </div>
        <div>
          <span>Drafts ready</span>
          <strong>{draftCount}</strong>
        </div>
        <p>
          Every customer-facing output is a merchant preview. RecoveryOS does
          not send email or place calls.
        </p>
      </div>

      <div className={styles.grid}>
        {cases.map((item) => (
          <RecoveryCaseCard item={item} key={item.publicId} />
        ))}
      </div>
    </section>
  );
}
