import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { formatMoney, formatPercentage } from "@/lib/formatters";

import type { AnalyticsOverview } from "../schemas";
import { BarChart } from "./bar-chart";
import styles from "./dashboard.module.css";
import { KpiCard } from "./kpi-card";

export function DashboardOverview({
  overview,
}: {
  overview: AnalyticsOverview;
}) {
  const simulation = overview.latestSimulationRun;

  return (
    <div className="page-stack">
      <div className={styles.sourceRow}>
        {overview.dataSources.map((source) => (
          <DataSourceBadge key={source} source={source} />
        ))}
        <span className={styles.liveNote}>Calculated from persisted cases</span>
      </div>

      <section aria-label="Recovery metrics" className={styles.kpiGrid}>
        <KpiCard
          hint="Across all reported payment failures"
          label="Revenue at risk"
          value={formatMoney(overview.kpis.totalRevenueAtRiskPaise)}
        />
        <KpiCard
          hint="Verified recovery recorded on cases"
          label="Recovered revenue"
          positive
          value={formatMoney(overview.kpis.recoveredRevenuePaise)}
        />
        <KpiCard
          hint="Recovered value divided by value at risk"
          label="Recovery rate"
          positive
          value={formatPercentage(overview.kpis.recoveryRateBps)}
        />
        <KpiCard
          hint="Value still unresolved across open cases"
          label="Outstanding risk"
          value={formatMoney(overview.kpis.outstandingRevenueAtRiskPaise)}
        />
      </section>

      <section className={`surface ${styles.panel}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Recovery funnel</h2>
            <p className={styles.panelSubtitle}>
              How reported failures move toward verified recovery
            </p>
          </div>
        </div>
        <div className={styles.funnel}>
          {[
            [overview.funnel.totalCases, "Reported failures"],
            [overview.funnel.recoverableCases, "Recoverable cases"],
            [overview.funnel.approvedActionCases, "Policy-approved action"],
            [overview.funnel.recoveredCases, "Recovered cases"],
          ].map(([value, label], index) => (
            <div className={styles.funnelStep} key={label}>
              <span className={styles.funnelIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong className={styles.funnelValue}>{value}</strong>
              <span className={styles.funnelLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={`surface ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Failure exposure</h2>
              <p className={styles.panelSubtitle}>
                Revenue at risk by diagnosed category
              </p>
            </div>
          </div>
          <BarChart
            items={overview.failureBreakdown.map((item) => ({
              label: item.value,
              value: item.revenueAtRiskPaise,
              valueLabel: formatMoney(item.revenueAtRiskPaise),
            }))}
          />
        </section>

        <section className={`surface ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Strategy performance</h2>
              <p className={styles.panelSubtitle}>
                Successful executions by proposed action
              </p>
            </div>
          </div>
          <BarChart
            items={overview.strategyPerformance.map((item) => ({
              label: item.actionType,
              value: item.successRateBps,
              valueLabel: formatPercentage(item.successRateBps),
            }))}
            positive
          />
        </section>
      </div>

      {simulation ? (
        <section className={`surface ${styles.panel} ${styles.simulation}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recovery uplift simulation</h2>
              <p className={styles.panelSubtitle}>
                Deterministic comparison across no action, naive retry, and the
                RecoveryOS strategy
              </p>
            </div>
            <DataSourceBadge source={simulation.dataSource} />
          </div>
          <div className={styles.comparison}>
            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>No intervention</span>
              <strong className={styles.comparisonValue}>
                {formatMoney(simulation.noInterventionRevenuePaise)}
              </strong>
            </div>
            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>Naive baseline</span>
              <strong className={styles.comparisonValue}>
                {formatMoney(simulation.baselineRevenuePaise)}
              </strong>
            </div>
            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>RecoveryOS</span>
              <strong className={styles.comparisonValue}>
                {formatMoney(simulation.recoveredRevenuePaise)}
              </strong>
            </div>
            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>
                Incremental recovery
              </span>
              <strong
                className={`${styles.comparisonValue} ${styles.incremental}`}
              >
                +{formatMoney(simulation.incrementalRevenuePaise)}
              </strong>
            </div>
          </div>
          <div className={styles.simulationFoot}>
            <span>{simulation.paymentCount} synthetic payments</span>
            <span>{simulation.attempts} recovery attempts</span>
            <span>{simulation.policyStops} policy stops</span>
            <span>{simulation.escalations} escalations</span>
            <span>{simulation.falseInterventions} false interventions</span>
            <span>
              {simulation.preventedFalseInterventions} interventions prevented
            </span>
            <span>{simulation.customerContacts} simulated contacts</span>
            <span>
              {formatMoney(simulation.revenueAtRiskPaise)} at risk ·{" "}
              {formatPercentage(simulation.recoveryRateBps)} RecoveryOS recovery
              rate
            </span>
            <span>
              Frozen run · seed {simulation.seed} ·{" "}
              {simulation.configurationHash}
              {" · "}
              {simulation.paymentCount * 3} stored outcomes
            </span>
            <span>All amounts are simulated; no real money moved</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
