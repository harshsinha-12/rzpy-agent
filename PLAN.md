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

**Status:** Blocked

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

**Status:** Awaiting approval; live paid-link acceptance pending

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

## Step 12 — Deployment and hackathon demo package

**Status:** In progress

**Goal:** Produce a reliable, judge-ready deployed demonstration.

**Deliverables:**

- Frontend deployment on Vercel
- Long-running API and worker services on Railway
- External managed PostgreSQL and Redis Cloud connected to both Railway runtimes
- Public HTTPS webhook endpoint configured in Razorpay Test Mode
- Production-like seed command and demo reset procedure
- Demo script, architecture explanation, backup recording, and failure fallback
- Public About page explaining the product, integrations, safety boundaries, and worker scheduling model
- Repository-level architecture document with system and queue Mermaid diagrams
- Final human setup, run, test, configuration, and verification guide

**Acceptance gate:**

- Public pages load expected content.
- A Razorpay Test Mode event reaches the deployed application.
- The worker processes delayed jobs after API requests finish.
- The full demo can be reset and repeated predictably.
- No secrets are present in Git history or frontend bundles.

## Deferred work

These items require a separate plan after the core project is complete:

- Subscription recovery
- Real SMS, email, or WhatsApp delivery
- Merchant chat interface
- Multi-merchant authentication and onboarding
- Voice recovery
- Adaptive strategy learning from production outcomes
- Live Mode Razorpay integration
