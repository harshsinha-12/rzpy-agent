import { formatLabel } from "@/lib/formatters";

import styles from "./status-badge.module.css";

const positiveValues = new Set([
  "APPROVED",
  "CAPTURED",
  "DRAFT_READY",
  "RECOVERED",
  "SUCCEEDED",
]);
const warningValues = new Set([
  "ACTION_REQUIRED",
  "DIAGNOSING",
  "OPEN",
  "PENDING",
  "RECOVERY_RUNNING",
  "RETRYING",
  "WAITING",
]);
const dangerValues = new Set([
  "DENIED",
  "ESCALATED",
  "EXHAUSTED",
  "FAILED",
  "STOPPED",
]);

export function StatusBadge({ value }: { value: string }) {
  const tone = positiveValues.has(value)
    ? styles.positive
    : warningValues.has(value)
      ? styles.warning
      : dangerValues.has(value)
        ? styles.danger
        : styles.brand;

  return (
    <span className={`${styles.badge} ${tone}`}>{formatLabel(value)}</span>
  );
}
