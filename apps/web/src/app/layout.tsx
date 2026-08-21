import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { appBaseUrl } from "@/config/env";

import "./globals.css";

const description =
  "Explainable, policy-controlled revenue recovery for Razorpay merchants.";
const socialTitle = "RecoveryOS · Revenue recovery control room";

export const metadata: Metadata = {
  applicationName: "RecoveryOS",
  description,
  metadataBase: new URL(appBaseUrl),
  openGraph: {
    description,
    siteName: "RecoveryOS",
    title: socialTitle,
    type: "website",
  },
  title: {
    default: socialTitle,
    template: "%s · RecoveryOS",
  },
  twitter: {
    card: "summary_large_image",
    description,
    title: socialTitle,
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
