import { StatusBadge } from "@/components/ui/status-badge";
import { formatLabel } from "@/lib/formatters";

import type { RecoveryCaseDetail } from "../schemas";
import styles from "./recovery-detail.module.css";

interface DiagnosisEvidenceProps {
  customerContactAllowed: RecoveryCaseDetail["customerContactAllowed"];
  evidence: RecoveryCaseDetail["diagnosisEvidence"];
}

export function DiagnosisEvidence({
  customerContactAllowed,
  evidence,
}: DiagnosisEvidenceProps) {
  return (
    <div>
      <div className={styles.evidenceHeader}>
        <h3 className={styles.evidenceTitle}>Evidence used</h3>
        {customerContactAllowed !== null ? (
          <StatusBadge
            value={
              customerContactAllowed
                ? "CUSTOMER_CONTACT_ALLOWED"
                : "CUSTOMER_CONTACT_AVOIDED"
            }
          />
        ) : null}
      </div>
      {evidence.length > 0 ? (
        <ul className={styles.evidenceList}>
          {evidence.map((item) => (
            <li
              className={styles.evidenceItem}
              key={`${item.signal}-${item.value}`}
            >
              <span className={styles.evidenceSignal}>
                {formatLabel(item.signal)}
              </span>
              <strong className={styles.evidenceValue}>
                {formatLabel(item.value)}
              </strong>
              <span className={styles.evidenceExplanation}>
                {item.explanation}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.evidenceEmpty}>
          No structured diagnosis evidence is stored for this legacy case.
        </p>
      )}
    </div>
  );
}
