import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            RecoveryOS
          </Link>
          <nav aria-label="Primary navigation" className={styles.nav}>
            <Link className={styles.navLink} href="/">
              Overview
            </Link>
            <Link className={styles.navLink} href="/recoveries">
              Reported issues
            </Link>
            <Link className={styles.navLink} href="/demo/checkout">
              Test payment
            </Link>
          </nav>
          <div className={styles.workspace}>
            <span>Aurora Retail</span>
            <span className={styles.workspaceMode}>Demo workspace</span>
          </div>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
