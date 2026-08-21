import styles from "./dashboard.module.css";

interface KpiCardProps {
  hint: string;
  label: string;
  positive?: boolean;
  value: string;
}

export function KpiCard({ hint, label, positive, value }: KpiCardProps) {
  return (
    <article className={`surface ${styles.kpiCard}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong
        className={`${styles.kpiValue} ${positive ? styles.positiveValue : ""}`}
      >
        {value}
      </strong>
      <span className={styles.kpiHint}>{hint}</span>
    </article>
  );
}
