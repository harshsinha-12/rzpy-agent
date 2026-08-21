import {
  dataSources,
  failureCategories,
  paymentMethods,
  recoveryCaseStatuses,
} from "@recoveryos/domain";
import Link from "next/link";

import { formatLabel } from "@/lib/formatters";

import type { RecoveryQuery } from "../query";
import styles from "./recoveries.module.css";

export function RecoveryFilters({ query }: { query: RecoveryQuery }) {
  return (
    <form action="/recoveries" className={`surface ${styles.filters}`}>
      <label className={`${styles.field} ${styles.searchField}`}>
        <span className={styles.fieldLabel}>Search</span>
        <input
          className={styles.control}
          defaultValue={query.search}
          name="search"
          placeholder="Payment, order, or case ID"
          type="search"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Recovery state</span>
        <select
          className={styles.control}
          defaultValue={query.status ?? ""}
          name="status"
        >
          <option value="">All states</option>
          {recoveryCaseStatuses.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Payment method</span>
        <select
          className={styles.control}
          defaultValue={query.paymentMethod ?? ""}
          name="paymentMethod"
        >
          <option value="">All methods</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {formatLabel(method)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Failure category</span>
        <select
          className={styles.control}
          defaultValue={query.failureCategory ?? ""}
          name="failureCategory"
        >
          <option value="">All categories</option>
          {failureCategories.map((category) => (
            <option key={category} value={category}>
              {formatLabel(category)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Data source</span>
        <select
          className={styles.control}
          defaultValue={query.dataSource ?? ""}
          name="dataSource"
        >
          <option value="">All sources</option>
          {dataSources.map((source) => (
            <option key={source} value={source}>
              {formatLabel(source)}
            </option>
          ))}
        </select>
      </label>

      <input name="pageSize" type="hidden" value={query.pageSize} />
      <input name="sortBy" type="hidden" value={query.sortBy} />
      <input name="sortOrder" type="hidden" value={query.sortOrder} />

      <div className={styles.filterActions}>
        <button className={styles.primaryButton} type="submit">
          Apply
        </button>
        <Link className={styles.secondaryButton} href="/recoveries">
          Reset
        </Link>
      </div>
    </form>
  );
}
