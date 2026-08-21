import Link from "next/link";

import { recoveryHref, type RecoveryQuery } from "../query";
import type { RecoveryCasesResponse } from "../schemas";
import styles from "./recoveries.module.css";

export function Pagination({
  meta,
  query,
}: {
  meta: RecoveryCasesResponse["meta"];
  query: RecoveryQuery;
}) {
  const start = meta.totalItems === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.totalItems);

  return (
    <nav aria-label="Recovery case pagination" className={styles.pagination}>
      <span className={styles.paginationText}>
        Showing {start}–{end} of {meta.totalItems} cases
      </span>
      <div className={styles.paginationLinks}>
        {meta.page > 1 ? (
          <Link
            className={styles.pageLink}
            href={recoveryHref(query, { page: meta.page - 1 })}
          >
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className={styles.pageDisabled}>
            Previous
          </span>
        )}
        {meta.page < meta.totalPages ? (
          <Link
            className={styles.pageLink}
            href={recoveryHref(query, { page: meta.page + 1 })}
          >
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={styles.pageDisabled}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
