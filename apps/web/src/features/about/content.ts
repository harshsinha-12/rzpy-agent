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
