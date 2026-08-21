import { formatLabel } from "@/lib/formatters";

import styles from "./dashboard.module.css";

interface BarChartItem {
  label: string;
  value: number;
  valueLabel: string;
}

export function BarChart({
  items,
  positive = false,
}: {
  items: BarChartItem[];
  positive?: boolean;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={styles.chartList} role="list">
      {items.map((item) => (
        <div className={styles.barRow} key={item.label} role="listitem">
          <span className={styles.barLabel}>{formatLabel(item.label)}</span>
          <span
            aria-label={`${formatLabel(item.label)}: ${item.valueLabel}`}
            className={styles.barTrack}
            role="img"
          >
            <span
              className={`${styles.barFill} ${positive ? styles.barFillPositive : ""}`}
              style={{
                width: `${Math.max((item.value / maxValue) * 100, 2)}%`,
              }}
            />
          </span>
          <span className={styles.barValue}>{item.valueLabel}</span>
        </div>
      ))}
    </div>
  );
}
