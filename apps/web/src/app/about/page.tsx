import type { Metadata } from "next";

import { AboutProject } from "@/features/about/components/about-project";

export const metadata: Metadata = {
  description:
    "Understand how RecoveryOS combines Razorpay Test Mode, OpenAI, deterministic policy, PostgreSQL, Redis, BullMQ, and a background worker.",
  title: "About the project",
};

export default function AboutPage() {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">About RecoveryOS</p>
          <h1 className="page-title">
            Razorpay detects failure.
            <br />
            <span className="title-accent">
              RecoveryOS decides what follows.
            </span>
          </h1>
          <p className="page-description">
            An explainable, policy-controlled system that turns failed payments
            into recoverable cases, schedules the right next action, and tracks
            the outcome without giving AI direct control over money or messages.
          </p>
        </div>
      </header>
      <AboutProject />
    </div>
  );
}
