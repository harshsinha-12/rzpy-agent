import Link from "next/link";
import type { ReactNode } from "react";

import { landingNav } from "../content";
import styles from "./landing.module.css";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            RecoveryOS
          </Link>
          <nav aria-label="Marketing navigation" className={styles.nav}>
            <Link className={styles.navLink} href="/about">
              {landingNav.about}
            </Link>
            <Link className={styles.navLink} href="/demo/checkout">
              {landingNav.testPayment}
            </Link>
            <Link className={styles.navPrimary} href="/dashboard">
              {landingNav.openDashboard}
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
