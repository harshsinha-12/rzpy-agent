import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatLabel } from "@/lib/formatters";

import type { RecoveryCaseDetail } from "../schemas";
import styles from "./recovery-detail.module.css";

type RecoveryAction = RecoveryCaseDetail["actions"][number];

export function RecoveryActionCard({ action }: { action: RecoveryAction }) {
  const proposalLabel =
    action.proposalSource === "OPENAI"
      ? `AI proposal${action.proposalModel ? ` · ${action.proposalModel}` : ""}`
      : action.proposalSource === "DETERMINISTIC_FALLBACK"
        ? "Deterministic fallback proposal"
        : `Proposed by ${formatLabel(action.proposedBy)}`;

  return (
    <article className={styles.action}>
      <div className={styles.actionHeader}>
        <strong className={styles.actionTitle}>
          Attempt {action.attemptNumber}: {formatLabel(action.actionType)}
        </strong>
        <StatusBadge value={action.result} />
      </div>
      <span className={styles.proposalSource}>{proposalLabel}</span>
      <p className={styles.actionReason}>{action.reason}</p>
      {action.proposalEvidence.length > 0 ? (
        <ul className={styles.proposalEvidence}>
          {action.proposalEvidence.map((evidence) => (
            <li key={evidence}>{evidence}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.policy}>
        <div className={styles.policyHeading}>
          <StatusBadge value={action.policyDecision} />
          {action.safeFallbackAction ? (
            <span>Safe fallback: {formatLabel(action.safeFallbackAction)}</span>
          ) : null}
        </div>
        <span className={styles.policyReason}>{action.policyReason}</span>
        {action.policyViolations.length > 0 ? (
          <ul className={styles.policyViolations}>
            {action.policyViolations.map((violation) => (
              <li key={violation.code}>
                <strong>{formatLabel(violation.code)}:</strong>{" "}
                {violation.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className={styles.actionMeta}>
        <span>{action.confidence}% confidence</span>
        <span>{formatDateTime(action.createdAt)}</span>
        {action.scheduledFor ? (
          <span>Eligible {formatDateTime(action.scheduledFor)}</span>
        ) : null}
      </div>
      {action.paymentLinkShortUrl ? (
        <a
          className={styles.paymentLink}
          href={action.paymentLinkShortUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open Test Mode Payment Link
        </a>
      ) : null}
    </article>
  );
}
