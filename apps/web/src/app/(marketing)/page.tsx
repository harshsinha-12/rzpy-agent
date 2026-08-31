import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/components/landing-page";

export const metadata: Metadata = {
  description:
    "RecoveryOS turns failed Razorpay payments into diagnosed cases, policy-guarded actions, and verified outcomes.",
  title: "Explainable revenue recovery",
};

export default function MarketingHomePage() {
  return <LandingPage />;
}
