export const reportedIssueWorkflow = [
  {
    column: "Payment / case",
    description:
      "A failed Razorpay payment becomes one durable row instead of disappearing into a log.",
    index: "01",
    title: "Detect",
  },
  {
    column: "Failure",
    description:
      "Deterministic diagnosis classifies the source, reason, method, and attempt history.",
    index: "02",
    title: "Diagnose",
  },
  {
    column: "Proposed action",
    description:
      "GPT-5.6 Terra proposes one bounded next step from read-only case facts.",
    index: "03",
    title: "Decide",
  },
  {
    column: "Policy",
    description:
      "Policy can approve, delay, replace, escalate, or deny before any side effect.",
    index: "04",
    title: "Guard",
  },
  {
    column: "Recovery state",
    description:
      "BullMQ runs only approved work: wait, silent Payment Link, escalate, or stop.",
    index: "05",
    title: "Execute",
  },
  {
    column: "Case detail",
    description:
      "Open a row to see verification, the audit timeline, and whether money came back.",
    index: "06",
    title: "Observe",
  },
] as const;
