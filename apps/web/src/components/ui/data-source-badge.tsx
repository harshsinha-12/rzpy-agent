import type { DataSource } from "@recoveryos/domain";

import styles from "./data-source-badge.module.css";

export function DataSourceBadge({ source }: { source: DataSource }) {
  return (
    <span
      className={`${styles.badge} ${source === "RAZORPAY_TEST_MODE" ? styles.testMode : ""}`}
    >
      {source === "SIMULATED" ? "SIMULATED DATA" : "RAZORPAY TEST MODE"}
    </span>
  );
}
