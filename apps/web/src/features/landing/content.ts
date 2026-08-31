/** Frozen Step 15 submission figures. Do not invent new landing metrics. */
export const frozenSimulationProof = {
  configurationHash: "925ba5d2",
  escalations: 63,
  incrementalRevenuePaise: 78_363_200,
  label: "SIMULATED" as const,
  naiveRetryRevenuePaise: 55_059_100,
  noInterventionRevenuePaise: 33_313_100,
  paymentCount: 500,
  policyStops: 164,
  preventedUnnecessaryInterventions: 8,
  recoveredRevenuePaise: 133_422_300,
  recoveryRateBps: 4520,
  revenueAtRiskPaise: 287_558_200,
  seed: 20260821,
} as const;

export const testModeProof = {
  amountPaise: 100,
  label: "RAZORPAY_TEST_MODE" as const,
  outcome: "One policy-approved silent Payment Link paid in Test Mode",
} as const;

export const landingHero = {
  ctaPrimary: "Open dashboard",
  ctaSecondary: "Try a Test Mode payment",
  eyebrow: "AI revenue recovery for Razorpay merchants",
  problemEmphasis: "decide what happens next.",
  problemLead: "When a payment fails,",
  promise:
    "RecoveryOS diagnoses the cause, proposes one bounded action, lets deterministic policy approve or stop it, and follows the payment to a verified outcome.",
  trustPoints: [
    "Cause-aware diagnosis",
    "Deterministic guardrails",
    "Auditable outcomes",
  ],
} as const;

export const landingNav = {
  about: "About",
  openDashboard: "Open dashboard",
  testPayment: "Test payment",
} as const;

export const recoveryLoopStages = [
  {
    description:
      "A signed failure or labelled synthetic case becomes one durable recovery record.",
    index: "01",
    owner: "Razorpay + API",
    title: "Detect",
  },
  {
    description:
      "Deterministic code classifies the failure from method, reason, and history.",
    index: "02",
    owner: "Recovery engine",
    title: "Diagnose",
  },
  {
    description:
      "The model returns one structured recommendation from read-only case facts.",
    index: "03",
    owner: "OpenAI proposal",
    title: "Propose",
  },
  {
    description:
      "Policy checks consent, limits, cooldowns, duplicates, and payment state.",
    index: "04",
    owner: "Policy engine",
    title: "Guard",
  },
  {
    description:
      "Only an approved tool can create a silent Test Mode Payment Link or wait.",
    index: "05",
    owner: "Approved tools",
    title: "Execute",
  },
  {
    description:
      "Provider state is rechecked and written to the audit timeline.",
    index: "06",
    owner: "Provider + audit",
    title: "Verify",
  },
] as const;

export const productDifference = [
  {
    body: "A gateway timeout, an authentication failure, and a merchant error should not receive the same recovery action.",
    index: "01",
    title: "Understand the failure",
  },
  {
    body: "The model recommends. Policy can approve, delay, replace, escalate, or stop before any tool runs.",
    index: "02",
    title: "Separate advice from authority",
  },
  {
    body: "Every outcome is compared with no intervention and naive retry, then written to an audit trail.",
    index: "03",
    title: "Measure incremental recovery",
  },
] as const;

export const recoveryScenarios = [
  "Failed payments",
  "Checkout drop-off",
  "Subscriptions",
  "B2B receivables",
  "Mandate retries",
  "Voice recovery",
  "Promise-to-pay",
] as const;

export const operatingLayers = [
  {
    body: "Razorpay events and merchant-selected recovery opportunities enter one durable case model.",
    index: "01",
    label: "Signals",
    title: "Know what slipped",
  },
  {
    body: "Deterministic diagnosis and a read-only AI proposal turn context into one explainable next step.",
    index: "02",
    label: "Intelligence",
    title: "Choose with context",
  },
  {
    body: "Consent, limits, cooldowns, duplicates, and current payment state decide what is actually allowed.",
    index: "03",
    label: "Authority",
    title: "Let policy decide",
  },
  {
    body: "Approved tools act, provider truth is rechecked, and every handoff lands in the audit timeline.",
    index: "04",
    label: "Outcome",
    title: "Prove what happened",
  },
] as const;

export const productMockups = {
  caseTimeline: {
    eyebrow: "Case timeline",
    steps: [
      { label: "Detected", state: "done" as const },
      { label: "Proposed", state: "done" as const },
      { label: "Guarded", state: "done" as const },
      { label: "Recovered", state: "active" as const },
    ],
    title: "Every decision stays auditable.",
  },
  dashboard: {
    eyebrow: "Dashboard",
    title: "See the money before the noise.",
  },
  reportedIssue: {
    action: "Create Payment Link",
    diagnosis: "Customer authentication timeout",
    eyebrow: "Reported Issues",
    method: "UPI",
    policy: "Approved · delayed",
    source: "RAZORPAY_TEST_MODE" as const,
    state: "Action scheduled",
    title: "One failed payment. One next step.",
  },
} as const;

export const safetyStrip = {
  body: "The model can recommend wait, a Payment Link, escalation, or stop. It cannot move money, contact customers, write durable state, or bypass merchant policy.",
  boundaries: [
    "No payment tools",
    "No database writes",
    "No messaging access",
    "Policy has final say",
  ],
  title: "AI can propose. It cannot move money.",
} as const;

export const proofStrip = {
  body: "Live Test Mode proof and the frozen batch comparison stay separate. Neither is real merchant revenue.",
  title: "Two kinds of evidence. Both clearly labelled.",
} as const;

export const landingSections = {
  difference: {
    eyebrow: "Why RecoveryOS",
    title: "Not a retry bot. A recovery control plane.",
  },
  howItWorks: {
    eyebrow: "How it works",
    intro:
      "Each handoff has a named owner, a narrow responsibility, and an audit event.",
    title: "One loop. Six explicit handoffs.",
  },
  operatingModel: {
    eyebrow: "One recovery operating model",
    intro:
      "Different revenue leaks need different interventions. They still share the same accountable path from signal to verified outcome.",
    title: "Many recovery moments. One control plane.",
  },
  mockups: {
    eyebrow: "Merchant surfaces",
    intro:
      "Start with money at risk, move into one explainable decision, then inspect every event that produced the outcome.",
    title: "A control room built for decisions.",
  },
} as const;

export const finalCallToAction = {
  body: "Start with the executive view, then open Reported Issues to inspect the decisions behind every recovery outcome.",
  eyebrow: "See the system at work",
  primary: "Enter the control room",
  secondary: "Read the architecture",
  title: "The metric is money. The product is trust.",
} as const;
