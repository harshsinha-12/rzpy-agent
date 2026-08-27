export const recoveryStages = [
  {
    description:
      "Razorpay Test Mode sends a payment failure, or the demo simulator creates a clearly labelled synthetic case.",
    index: "01",
    title: "Detect",
  },
  {
    description:
      "A deterministic engine reads the failure source, reason, payment method, and attempt history.",
    index: "02",
    title: "Diagnose",
  },
  {
    description:
      "GPT-5.6 Terra proposes one bounded recovery strategy using only the case facts it is given.",
    index: "03",
    title: "Decide",
  },
  {
    description:
      "Deterministic policy checks consent, cooldowns, limits, duplicates, and whether the payment already succeeded.",
    index: "04",
    title: "Guard",
  },
  {
    description:
      "BullMQ schedules an approved action. Only the execution layer can call Razorpay or update durable state.",
    index: "05",
    title: "Execute",
  },
  {
    description:
      "Recovery is verified, written to the audit timeline, and reflected in the dashboard and simulator comparison.",
    index: "06",
    title: "Observe",
  },
] as const;

export const challengeProof = [
  {
    detail:
      "A signed Razorpay Test Mode failure becomes one durable, idempotent recovery case instead of disappearing into a payment log.",
    label: "Detect",
    title: "Find revenue at risk",
  },
  {
    detail:
      "Deterministic diagnosis explains the failure, then GPT-5.6 Terra proposes one structured intervention from read-only facts.",
    label: "Determine",
    title: "Choose the right response",
  },
  {
    detail:
      "Policy can approve, delay, replace, escalate, or deny the proposal before the worker reaches any Razorpay tool.",
    label: "Bound",
    title: "Keep execution controlled",
  },
  {
    detail:
      "A reproducible 250–500-payment run compares RecoveryOS with no intervention and a naive retry using the same outcomes.",
    label: "Measure",
    title: "Show incremental recovery",
  },
  {
    detail:
      "Attempt limits, cooldowns, merchant-error rules, duplicate protection, and payment-state checks decide when to escalate or stop.",
    label: "Protect",
    title: "Avoid false intervention",
  },
  {
    detail:
      "The case timeline retains detection, evidence, proposal, policy decision, execution, verification, and the final outcome.",
    label: "Explain",
    title: "Make every action auditable",
  },
] as const;

export const deliveryProof = [
  {
    detail:
      "The Vercel merchant experience is connected to healthy Railway API and worker runtimes backed by Aiven PostgreSQL and Redis Cloud.",
    status: "Verified",
    step: "01",
    title: "Hosted foundation",
  },
  {
    detail:
      "A signed payment.failed event creates exactly one visible Test Mode case. Replaying the same provider event does not duplicate the case, action, or job.",
    status: "Verified",
    step: "02",
    title: "Webhook proof",
  },
  {
    detail:
      "The case timeline shows a GPT-5.6 Terra proposal, an independent policy decision, a silent action-bound Payment Link, and a verified paid Test Mode outcome.",
    status: "Verified",
    step: "03",
    title: "Live recovery loop",
  },
  {
    detail:
      "A frozen 250–500-payment run compares RecoveryOS with no intervention and naive retry, reconciling incremental rupees, policy stops, escalations, and false interventions.",
    status: "Verified",
    step: "04",
    title: "Measured evidence",
  },
  {
    detail:
      "The reset flow, audit trail, graceful Razorpay 5xx retry, architecture explanation, and judge walkthrough are packaged as a repeatable demo.",
    status: "Verified",
    step: "05",
    title: "Submission hardening",
  },
] as const;

export const integrationCards = [
  {
    detail:
      "Test checkout, signed webhook ingestion, payment status checks, and silent Test Mode Payment Links.",
    label: "Payments",
    title: "Razorpay Test Mode",
  },
  {
    detail:
      "Structured Responses API proposals with strict Zod validation, time and token limits, and a deterministic fallback.",
    label: "AI proposal",
    title: "OpenAI · GPT-5.6 Terra",
  },
  {
    detail:
      "Durable cases, payments, actions, policies, job records, simulator outcomes, and complete audit events.",
    label: "Source of truth",
    title: "PostgreSQL · Prisma",
  },
  {
    detail:
      "Persistent delayed work, bounded retries, stable job IDs, verification, and scheduled reconciliation.",
    label: "Async work",
    title: "Redis · BullMQ",
  },
  {
    detail:
      "Validated product APIs, webhook endpoints, analytics, simulator runs, secure headers, and rate limits.",
    label: "Backend",
    title: "Fastify · TypeScript",
  },
  {
    detail:
      "Executive recovery metrics, Reported Issues, case reasoning, Test Mode checkout, and visible data-source labels.",
    label: "Experience",
    title: "Next.js · React",
  },
] as const;

export const queueSteps = [
  "Payment event",
  "Failure analysis",
  "Recovery action",
  "Outcome verification",
  "Reconciliation",
] as const;
