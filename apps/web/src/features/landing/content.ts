/** Frozen Step 15 submission figures. Do not invent new landing metrics. */
export const frozenSimulationProof = {
  configurationHash: "925ba5d2",
  incrementalRevenuePaise: 78_363_200,
  label: "SIMULATED" as const,
  paymentCount: 500,
  policyStops: 164,
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
  brand: "RecoveryOS",
  ctaPrimary: "Open dashboard",
  ctaSecondary: "Try a Test Mode payment",
  problem: "A failed Razorpay payment usually ends as a log line.",
  promise:
    "RecoveryOS turns it into a diagnosed case, one guarded action, and a verified outcome.",
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
    title: "Detect",
  },
  {
    description:
      "Deterministic code classifies the failure from method, reason, and history.",
    index: "02",
    title: "Diagnose",
  },
  {
    description:
      "The model returns one structured recommendation from read-only case facts.",
    index: "03",
    title: "Propose",
  },
  {
    description:
      "Policy checks consent, limits, cooldowns, duplicates, and payment state.",
    index: "04",
    title: "Guard",
  },
  {
    description:
      "Only an approved tool can create a silent Test Mode Payment Link or wait.",
    index: "05",
    title: "Execute",
  },
  {
    description:
      "Provider state is rechecked and written to the audit timeline.",
    index: "06",
    title: "Verify",
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
    title: "One failed payment. One next step.",
  },
} as const;

export const safetyStrip = {
  body: "The model can recommend wait, a Payment Link, escalation, or stop. It cannot move money, contact customers, write durable state, or bypass merchant policy.",
  title: "AI can propose. It cannot move money.",
} as const;

export const proofStrip = {
  body: "Live Test Mode proof and the frozen batch comparison stay separate. Neither is real merchant revenue.",
  title: "Two kinds of evidence. Both clearly labelled.",
} as const;

export const landingSections = {
  howItWorks: {
    eyebrow: "How it works",
    title: "Detect → Diagnose → Propose → Guard → Execute → Verify",
  },
  mockups: {
    eyebrow: "Merchant surfaces",
    title: "What the operator sees.",
  },
} as const;
