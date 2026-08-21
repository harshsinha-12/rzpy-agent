import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "Explainable, policy-controlled revenue recovery for Razorpay merchants.",
  title: {
    default: "RecoveryOS · Revenue recovery control room",
    template: "%s · RecoveryOS",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
