import Link from "next/link";
import type { ReactNode } from "react";

import { publicApiUrl, publicWorkerHealthUrl } from "@/config/env";

import styles from "./app-shell.module.css";

const apiLivenessUrl = new URL("/health/live", publicApiUrl).toString();
const apiReadinessUrl = new URL("/health", publicApiUrl).toString();
const workerHealthUrl = new URL("/health", publicWorkerHealthUrl).toString();

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
            <Link className={styles.navLink} href="/about">
              About
            </Link>
          </nav>
          <div className={styles.workspace}>
            <span>RecoveryOS</span>
            <span className={styles.workspaceHealth}>
              <a href={apiLivenessUrl} rel="noreferrer" target="_blank">
                API live
              </a>
              <a href={apiReadinessUrl} rel="noreferrer" target="_blank">
                API ready
              </a>
              <a href={workerHealthUrl} rel="noreferrer" target="_blank">
                Worker
              </a>
            </span>
          </div>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
