# RecoveryOS Implementation Plan

This is the binding implementation order for the project. We will complete, verify, document, and obtain approval for each step before beginning the next one.

## Progress states

- **Not started** — no implementation work should occur yet
- **In progress** — the only step agents may implement
- **Blocked** — progress requires a named dependency or user decision
- **Awaiting approval** — acceptance checks pass; user approval is needed to advance
- **Complete** — verified and approved

## Step 0 — Planning and operating documents

**Status:** Complete

**Goal:** Establish the project contract before code is created.

**Deliverables:**

- Product concept in `idea.md`
- Agent instructions in `AGENTS.md`
- Project guide in `README.md`
- Step-gated plan in `PLAN.md`
- Current-state and session log in `STATUS.md`
- Decision ledger in `DECISIONS.md`
- Maintainable folder and file contract in `PROJECT_STRUCTURE.md`
- Secret-safe environment contract in `.env.example`

**Acceptance gate:**

- Documents agree on scope, stack, data labelling, and implementation order.
- The exact next implementation step is identified.
- The user approves moving to Step 1.

---

## Step 1 — Workspace foundation

**Status:** Complete

**Goal:** Create a runnable TypeScript monorepo without implementing product features.

**Deliverables:**

- Git repository initialization with the existing secret-safe `.gitignore`
- Pinned Node.js and pnpm versions for reproducible local and deployed builds
- `apps/web` Next.js application
- `apps/api` Fastify application
- `apps/worker` BullMQ worker process
- Shared packages for database, domain types, configuration, and Razorpay integration
- Feature-first modules following `PROJECT_STRUCTURE.md`, without empty placeholder architecture
- pnpm workspace configuration
- TypeScript, linting, formatting, and test configuration
- Husky pre-commit hook with staged-file linting and formatting
- Docker Compose services for PostgreSQL and Redis
- Health endpoints for the API and worker dependencies

**Acceptance gate:**

- Git tracks source and documentation without tracking local secrets or generated artifacts.
- Clean dependency installation succeeds.
- Type checking and linting succeed.
- The pre-commit hook is installed and its staged-file checks succeed.
- Web, API, PostgreSQL, Redis, and worker start locally.
- API health check confirms database and Redis connectivity.
- The created folders follow `PROJECT_STRUCTURE.md`, and every created source file has a current responsibility.
- No payment, AI, or recovery logic exists prematurely.

---

## Step 2 — Database schema and deterministic seed data

**Status:** Complete

**Goal:** Establish the durable domain model and populate realistic demo cases.

**Deliverables:**

- Prisma models for Merchant, Customer, PaymentEvent, RecoveryCase, RecoveryAction, AuditEvent, RecoveryPolicy, and SimulationRun
- Enums for case state, action type, policy decision, failure category, and data source
- Migration and seed commands
- Deterministic seed generator with a fixed random seed
- Seeded scenarios covering recovered, waiting, stopped, escalated, exhausted, and retry-failure cases
- Money stored as integer subunits

**Acceptance gate:**

- A fresh database migrates and seeds successfully.
- Re-running the seed produces predictable data without uncontrolled duplication.
- Every case is labelled `SIMULATED` or `RAZORPAY_TEST_MODE`.
- Referential integrity and important uniqueness constraints are tested.

---

## Step 3 — Read-only product API

**Status:** Complete

**Goal:** Expose the seeded recovery data through validated API endpoints.

**Deliverables:**

- `GET /recovery/cases`
- `GET /recovery/cases/:id`
- `GET /analytics/overview`
- Filters, search, sorting, and pagination for cases
- Consistent error envelope and Zod validation
- Calculation functions for dashboard metrics

**Acceptance gate:**

- API tests cover valid queries, invalid queries, missing cases, and pagination.
- Analytics reconcile exactly with underlying seeded records.
- No frontend component imports or bypasses the database directly.

---

## Step 4 — Dashboard and Reported Issues frontend

**Status:** Complete

**Goal:** Build a polished frontend using the read-only API and seeded data.

**Deliverables:**

- Executive KPI cards and recovery funnel
- Failure breakdown and strategy-performance charts
- Reported Issues table showing payment/order ID, amount, method, source, reason, recovery state, proposed action, policy decision, data source, and last update
- Search, filters, sorting, pagination, empty states, loading states, and error states
- Recovery detail page with reasoning and audit timeline
- Visible simulated/test-mode labelling

**Acceptance gate:**

- Every surface is populated from the API, not hardcoded component arrays.
- Table controls work together and preserve query state.
- Desktop and mobile layouts are usable.
- Key pages pass focused component tests and manual browser verification.

---

## Step 5 — Razorpay Test Mode ingestion

**Status:** Complete

**Goal:** Safely receive and persist actual Razorpay Test Mode payment events. Initially redirect to where I can get the API keys if needed for razorpay test mode and let me add them then after confirmation start implementing

**Deliverables:**

- Razorpay client wrapper
- `POST /webhooks/razorpay`
- Raw-body signature verification
- Raw event persistence and normalized payment fields
- Webhook event idempotency
- Fast acknowledgement followed by a BullMQ processing job
- Test-mode checkout or trigger flow for the demo

**Acceptance gate:**

- Valid signed events are accepted once.
- Invalid signatures are rejected.
- Duplicate deliveries do not create duplicate cases or actions.
- A real Test Mode failure appears in the Reported Issues table with a `RAZORPAY_TEST_MODE` label.

---

## Step 6 — Deterministic diagnosis engine

**Status:** Complete

**Goal:** Normalize Razorpay signals into explainable recovery facts before involving an LLM.

**Deliverables:**

- Mapping from `error_source`, `error_step`, `error_reason`, method, and attempt count to a failure category
- Recoverability band and evidence list
- Explicit handling for merchant errors, customer authentication, insufficient funds, gateway/network transients, issuer failures, and unknowns
- Safe fallback to `UNKNOWN` and `WAIT` or `ESCALATE`

**Acceptance gate:**

- Table-driven tests cover known categories and unknown payloads.
- Merchant integration failures never recommend customer contact.
- Diagnosis outputs are stored and visible in case details.

---

## Step 7 — AI proposal and deterministic policy engine

**Status:** Complete

**Goal:** Let AI propose a bounded strategy while deterministic code retains authority.

**Deliverables:**

- Structured OpenAI request and Zod-validated response
- Recovery agent split into `agent.ts`, `tools.ts`, `prompt.ts`, `schemas.ts`, and `types.ts`
- Allowed actions: `WAIT`, `CREATE_PAYMENT_LINK`, `SEND_REMINDER`, `ALTERNATIVE_METHOD`, `ESCALATE`, and `STOP`
- Deterministic policy checks for captured payments, action limits, message limits, cooldowns, recovery window, opt-out, duplicate actions, and merchant failures
- Complete audit events for proposals, approvals, and denials
- Deterministic fallback when the model is unavailable or returns invalid output

**Acceptance gate:**

- The LLM has no direct Razorpay, database-write, or messaging tool access.
- Policy tests prove prohibited actions remain blocked regardless of model output.
- Invalid or unavailable AI responses degrade safely.
- The UI explains both the AI proposal and policy decision.

---

## Step 8 — BullMQ recovery orchestration

**Status:** Complete

**Goal:** Execute recovery workflows asynchronously and reliably.

**Deliverables:**

- Queues for event processing, analysis, recovery actions, and verification
- Delayed jobs for cooldowns and later checks
- Retry policies with bounded exponential backoff
- Stable job IDs and database-backed idempotency records
- Failed-job visibility and structured logs
- Repeatable reconciliation job if required

**Acceptance gate:**

- Jobs survive API restarts because they are held in Redis.
- A temporary tool failure retries and succeeds without duplicate execution.
- Exhausted jobs produce an auditable escalated/stopped state.
- No external cron service or dedicated VM is required.

---

## Step 9 — Recovery execution tools

**Status:** Complete

**Goal:** Implement one real, bounded recovery action and safe simulated alternatives.

**Deliverables:**

- Payment status re-check before every execution
- Razorpay Test Mode Payment Link creation
- Payment Link reference tied to one recovery action
- Simulated reminder and alternative-method actions
- Stop and escalation actions
- Outcome verification from webhook and API state

**Acceptance gate:**

- Already captured payments cannot receive a recovery action.
- Retried jobs cannot create duplicate Payment Links.
- Tool inputs, outputs, failures, and Razorpay references are auditable.
- Successful Test Mode recovery updates the case and dashboard.

---

## Step 10 — Simulator and evaluation harness

**Status:** Complete

**Goal:** Demonstrate measurable recovery uplift across a reproducible synthetic batch.

**Deliverables:**

- Deterministic generator for 250–500 failed payments
- Hidden outcome model for strategy evaluation
- No-intervention and naive-retry baselines
- Agent strategy evaluation
- Revenue at risk, recovered revenue, incremental recovery, recovery rate, attempts, false interventions, policy stops, and customer-contact metrics
- Stored SimulationRun results

**Acceptance gate:**

- The same seed and configuration reproduce the same results.
- Aggregate metrics reconcile with individual outcomes.
- Simulation logic does not leak hidden probabilities into agent inputs.
- All monetary outputs are explicitly marked as simulated.

---

## Step 11 — Reliability, security, and end-to-end validation

**Status:** Complete

**Goal:** Prove the demo handles important unhappy paths safely.

**Deliverables:**

- Tests for duplicate webhooks, invalid signatures, already-captured payments, API failures, worker restarts, AI failures, policy violations, and malformed payloads
- Rate limits and secure headers where appropriate
- Redaction of secrets and sensitive payload fields from logs
- Graceful Razorpay API 5xx demo with retry and zero duplicates
- End-to-end test of the primary recovery flow

**Acceptance gate:**

- Type check, lint, unit, integration, and end-to-end suites pass.
- The deliberate Razorpay failure scenario is visible in the audit timeline.
- Known limitations are documented rather than hidden.

---

## Step 12 — Hosted runtime foundation

**Status:** Complete

**Goal:** Establish healthy public runtimes and managed infrastructure before sending real Test Mode events through the system.

**Deliverables:**

- Frontend deployment on Vercel
- Long-running API and worker services on Railway
- Aiven PostgreSQL and Redis Cloud connected to both Railway runtimes
- Redis Cloud configured with `no eviction` for reliable BullMQ state
- Public HTTPS domains, production CORS, and service-specific environment variables
- Production-like seed command and demo reset procedure
- Public About page explaining the product, integrations, safety boundaries, and worker scheduling model
- Repository-level architecture document with system and queue Mermaid diagrams
- Final human setup, run, test, configuration, and verification guide

**Acceptance gate:**

- Public pages load expected content.
- API `/health/live`, API `/health`, and worker `/health` succeed publicly.
- The worker remains connected to Redis and the repeatable reconciliation scheduler is registered.
- The full demo can be reset and repeated predictably.
- No secrets are present in Git history or frontend bundles.

---

## Step 13 — Razorpay Test Mode webhook proof

**Status:** Complete

**Goal:** Close the track's detection requirement by proving that an actual failed Test Mode payment becomes an idempotent RecoveryOS case.

**Deliverables:**

- Razorpay Test Mode webhook targeting the public Railway API at `POST /webhooks/razorpay`
- A new webhook signing secret stored only as `RAZORPAY_WEBHOOK_SECRET` on the API service
- Subscriptions for `payment.failed`, `payment.authorized`, `payment.captured`, and `payment_link.paid`
- One deliberately failed Test Mode checkout using Razorpay's documented failure method
- Captured webhook-delivery evidence without exposing payload secrets or payment identifiers
- A `RAZORPAY_TEST_MODE` row in Reported Issues with normalized failure facts
- Duplicate-delivery verification against the same provider event ID

**Acceptance gate:**

- Razorpay reports a successful HTTP delivery to the public HTTPS endpoint.
- The signature-valid raw event is retained once and acknowledged quickly.
- One normalized recovery case is created and queued exactly once.
- Replaying the event does not create a duplicate case, action, or job.
- The Test Mode case is visible in the deployed table and detail timeline.
- Step 5's pending live acceptance check can be marked complete after explicit approval.

---

## Step 14 — Bounded AI recovery and paid Test Mode outcome

**Status:** Complete

**Goal:** Prove the complete detect-to-recover loop on one real Test Mode case while deterministic policy retains execution authority.

**Deliverables:**

- Worker-side GPT-5.6 Terra proposal generated from read-only normalized case facts
- Stored diagnosis evidence, one schema-valid AI proposal, and deterministic policy decision
- Payment-state re-check immediately before execution
- One approved, silent, action-bound Razorpay Test Mode Payment Link
- Successful Test Mode payment of that recovery link
- Test Mode completion runbook using Razorpay's Netbanking demo-bank `Success` control; card/UPI failure paths remain useful for creating the initial failed-payment case, not for proving the paid recovery outcome
- `payment_link.paid` or provider-state verification updating the case and dashboard
- Complete audit timeline covering detection, diagnosis, proposal, guard, execution, verification, and outcome
- A contrasting policy-stop or escalation case showing that unsafe customer intervention is blocked

**Acceptance gate:**

- The LLM has no direct Razorpay, database-write, queue, or messaging access.
- Policy can approve, replace, delay, escalate, or reject the AI proposal independently.
- An already captured payment and a duplicate job cannot create another Payment Link.
- The paid Test Mode link changes the case to recovered and updates Test Mode metrics.
- The audit view explains why the action was proposed, who authorized it, what executed, and what happened.
- Step 9's pending paid-link acceptance check can be marked complete after explicit approval.

---

## Step 15 — Measured batch recovery evidence

**Status:** Complete

**Goal:** Meet the Razorpay track bar by presenting auditable, batch-level recovery value rather than only a single successful case.

**Deliverables:**

- A frozen, reproducible 250–500-payment simulation run for the submitted demo
- Side-by-side no-intervention, naive-retry, and RecoveryOS results over identical payment inputs and outcome rolls
- Revenue at risk, recovered revenue, incremental revenue, recovery rate, attempts, false interventions, policy stops, escalations, and customer-contact metrics
- Stored per-payment and per-strategy outcomes that reconcile to every aggregate
- Explicit `SIMULATED` labelling and copy that separates batch estimates from Test Mode payment proof
- A judge-facing challenge matrix covering detection, diagnosis, bounded execution, compliant escalation, stopping rules, audit trail, and measured recovery

**Acceptance gate:**

- Re-running the frozen seed reproduces the same inputs and results.
- Aggregate rupee and count metrics reconcile exactly with stored outcomes.
- RecoveryOS is compared with a named baseline; no unsupported real-revenue claim is made.
- At least one policy stop, escalation, and prevented false intervention is visible in the evidence.
- Dashboard, About page, README, and spoken demo use the same verified numbers and labels.

---

## Step 16 — Final judge demo and submission hardening

**Status:** Deferred by user

**Goal:** Package the verified live loop and measured batch evidence into a repeatable, failure-tolerant submission.

**Deliverables:**

- Final demo script beginning with revenue at risk and ending with incremental recovery
- Live sequence: failed checkout, case creation, diagnosis, AI proposal, policy decision, bounded execution, paid outcome, and updated dashboard
- Graceful Razorpay 5xx sequence showing bounded retry, backoff, audit visibility, and zero duplicate execution
- Reset checklist, known-good seed, backup screenshots, and backup recording
- Final architecture explanation and explicit AI-versus-policy responsibility statement
- Secret scan, production build, complete test suite, public-route smoke test, and repository cleanup
- Submission copy mapped directly to Razorpay's AI Revenue Recovery problem statement and judging bar

**Acceptance gate:**

- The complete demo can be repeated from the documented reset state.
- Live Test Mode evidence and simulated batch evidence are clearly distinguished.
- Compliant escalation, stopping rules, and the full audit trail are demonstrated rather than merely described.
- Public web, API, worker, database, Redis, OpenAI, and Razorpay integrations remain healthy for the recorded walkthrough.
- All relevant validations pass and no secrets appear in Git, logs, screenshots, or frontend bundles.
- The user explicitly approves the final submission package.

---

## Step 17 — Checkout drop-off recovery

**Status:** In progress

**Goal:** Recover orders that were created but never paid by letting the merchant choose which drop-offs receive a policy-gated recovery email.

**Deliverables:**

- Determine the classification for checkout drop-off cases
- Ingest and list checkout drop-off cases separately from `payment.failed` rows
- Merchant multi-select of drop-off cases that should receive a recovery email
- Email draft containing the unpaid order facts and a recovery Payment Link
- Deterministic policy approval before any email is queued
- Audit events for selection, draft, approval, send, and outcome

**Acceptance gate:**

- Drop-off cases are visible and selectable without mixing them into failed-payment rows.
- Only merchant-selected, policy-approved cases are emailed.
- The LLM can draft copy but cannot send email or create a Payment Link directly.
- Replay or re-select does not send duplicate email for the same case and draft.

---

## Step 18 — Failed-subscription recovery

**Status:** Not started

**Goal:** Recover recurring charges that pend or halt using the same select-and-email pattern as checkout drop-off.

**Deliverables:**

- Subscription failure cases from Razorpay pending/halted (or equivalent Test Mode) signals
- Merchant selection of which failed subscriptions receive a recovery email
- Policy-gated email with the failed cycle facts and a bounded recovery path
- Diagnosis that never nags a customer for a merchant-side subscription misconfiguration
- Audit trail covering detection, selection, policy, send, and subscription outcome

**Acceptance gate:**

- Failed-subscription rows are distinct from one-time payment failures.
- Email goes only to selected, policy-approved subscriptions.
- A captured or already-recovered cycle cannot receive another recovery email.
- Escalation and stop rules remain enforceable regardless of model copy.

---

## Step 19 — B2B receivables human-in-the-loop alerts

**Status:** Not started

**Goal:** Surface overdue B2B invoices as operator alerts so a human can take the next collection step.

**Deliverables:**

- Overdue receivables cases with due date, amount in paise, and ageing
- In-product human-in-the-loop alert when an invoice crosses the merchant threshold
- Operator acknowledge, snooze, escalate, or stop actions
- Optional policy-gated customer email after a human confirms outreach
- Audit events for alert raised, operator decision, and invoice outcome
- Currently add a UI to manually send alert althouh we won't since no API for it, the feature will be there

**Acceptance gate:**

- An overdue invoice creates a visible alert rather than a silent retry.
- A human decision is required before customer outreach.
- Duplicate alerts are not raised for the same unpaid invoice.
- Dashboard and case detail show who was alerted and what they decided.

---

## Step 20 — Mandate retry sequencing

**Status:** Not started

**Goal:** Sequence e-mandate and auto-debit failures with the same select, email, and human-alert pattern.

**Deliverables:**

- Mandate failure cases with bank/NPCI window and retry eligibility
- Merchant selection of which mandate failures receive a recovery email
- Human-in-the-loop alert when a mandate is cancelled, exhausted, or unsafe to retry
- Bounded retry schedule that respects cooldowns and stop rules
- Audit trail for each sequenced attempt and operator override

**Acceptance gate:**

- Mandate cases are not treated as ordinary checkout failures.
- Retries follow the sequenced window; they do not fire immediately on every event.
- Cancelled or exhausted mandates escalate to a human instead of another debit.
- Selected email outreach remains policy-gated and idempotent.

---

## Step 21 — Generated voice recovery messages

**Status:** Not started

**Goal:** Generate the outbound recovery call the customer would receive, store it, and let the merchant play it in the product.

**Deliverables:**

- OpenAI text-to-speech generation of a Hinglish or Hindi recovery message
- Script that states the failed amount, the reason-safe next step, and the recovery Payment Link
- Persistent storage of the audio object plus Postgres metadata (case, language, script, URI, created-by)
- In-product player so the merchant can hear the message the customer would receive
- Policy check before a voice message is generated or marked ready to send
- Evaluation of a durable object/blob store for audio; Redis remains job infrastructure only

**Acceptance gate:**

- A merchant can generate, store, and replay a voice message for a selected case.
- The spoken script includes the recovery link and does not invent payment state.
- Regenerating the same case keeps an auditable version history.
- Secrets never appear in the audio metadata, logs, or frontend bundle.

---

## Step 22 — Promise-to-pay and udhaar tracker

**Status:** Not started

**Goal:** Track customers who took udhaar (credit now, settle later) and remind them with a dated recovery message and generated voice.

**Deliverables:**

- Promise-to-pay / udhaar records with amount in paise, promise date, and month-end default due date
- Hindi-first reminder copy in the spirit of “udhaar le liya, mahine ke end tak wapas karna hai”
- Scheduled reminder when the due date approaches
- Generated voice recovery message the customer would receive, replayable by the merchant
- Policy-gated email or in-product reminder alongside the voice message
- Outcome of kept promise, broken promise, extension, or human escalation

**Acceptance gate:**

- An udhaar case shows who owes what and by when.
- A reminder and voice message are generated before the due date, not as a blind immediate retry.
- A kept promise marks the case recovered; a broken promise escalates or schedules one bounded follow-up.
- Live Test Mode money, simulated batch money, and udhaar reminders stay distinctly labelled.

---

## Step 23 — Public product landing

**Status:** In progress

**Goal:** Give a first-time visitor a short, visual explanation of RecoveryOS before they enter the operator product. The page should answer “what is this?” in one screen, then show the recovery loop with compact mockups so a judge or merchant understands the product without reading the repository.

**Placement:** After Steps 17–22. Do not start this step while an earlier step is in progress. `/about` remains the judge-facing architecture and challenge-proof page; this landing is the plain-language first impression.

**Routing contract:**

- `/` becomes the marketing landing and must render without the API.
- The executive dashboard moves to `/dashboard`.
- Use Next.js route groups so the landing has its own marketing chrome and the operator pages keep `AppShell`.
- Existing product links that currently treat `/` as the dashboard (`AppShell` Overview, About “Review the dashboard”, README, DEMO_SCRIPT) must be updated in the same step.

**Deliverables:**

- A `features/landing` module with `content.ts` for copy, focused components, CSS, and tests. Route files compose; they do not own long copy or mockup markup.
- A marketing layout with a wordmark, a primary “Open dashboard” action, and secondary links to About and Test payment. No API/worker health chrome on the landing.
- Hero section: one-line problem, one-line product promise, two short CTAs (open the dashboard, try a Test Mode payment). Include one compact product-frame mockup in the hero, not a screenshot of live cases.
- How-it-works section: the six-stage loop in plain language (Detect → Diagnose → Propose → Guard → Execute → Verify). Animate the sequence with CSS; keep each stage to a short title and one sentence.
- Three short product mockups that explain the merchant surfaces without live data:
  - a dashboard frame (revenue at risk, recovered, policy stops);
  - a Reported Issues row (failed UPI, diagnosis, proposed action, policy decision);
  - a case-timeline frame (detected → proposed → guarded → recovered).
- A safety strip: AI can propose; it cannot move money, contact customers, or bypass policy.
- A proof strip that distinguishes `RAZORPAY_TEST_MODE` live loop evidence from `SIMULATED` batch figures. Any rupee amounts on the landing must reuse the frozen Step 15 numbers and keep those labels. Do not invent new metrics.
- CSS-first motion: hero entrance, staged loop highlight, and mockup reveal on scroll. Honor `prefers-reduced-motion: reduce` with a static layout. Do not add a new animation library unless CSS cannot deliver the sequence.
- Keep the existing cream, navy, editorial-serif, cobalt visual system. The landing should feel like RecoveryOS, not a second product skin.
- Update `AppShell`, About dashboard links, README product surfaces, DEMO_SCRIPT opener, `PROJECT_STRUCTURE.md`, and local/hosted route tables so `/dashboard` is the operator home.
- Add a concise README screenshot gallery using real rendered product captures with descriptive alt text and explicit data-source labelling.

**Acceptance gate:**

- Visiting `/` explains what RecoveryOS does in under a minute without repository knowledge or a running API.
- `/dashboard`, `/recoveries`, `/recoveries/[id]`, `/demo/checkout`, and `/about` remain reachable and keep their current responsibilities.
- Mockups are illustrative CSS/HTML frames. They do not hardcode live dashboard arrays, payment identifiers, or customer records. Any money shown is labelled `SIMULATED` or `RAZORPAY_TEST_MODE`.
- The landing and About pages do not duplicate each other: landing teaches the story; About proves architecture, challenge fit, and AI safety in depth.
- Motion is noticeable on desktop and restrained on mobile; reduced-motion users see the same content without animation.
- Desktop and a representative mobile viewport are verified in the browser, including the hero CTAs and the path from landing → dashboard → Reported Issues.
- Focused component tests cover landing copy, CTAs, dashboard relocation, and the absence of operator health links on `/`.
- Web lint, typecheck, and production build succeed; `/` is statically generated.
- README screenshots render from repository-owned assets and do not expose secrets or unlabeled live merchant data.

---

## Deferred work

These items still require a separate plan after Steps 17–23:

- Live placement of the generated voice onto a telephony carrier
- Real SMS or WhatsApp delivery
- Merchant chat interface
- Multi-merchant authentication and onboarding
- Adaptive strategy learning from production outcomes
- Live Mode Razorpay integration
