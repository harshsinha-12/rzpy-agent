# Project Status

Last updated: 2026-08-27

## Current snapshot

- **Current step:** Step 12 — Deployment and hackathon demo package
- **State:** Step 12 is in progress. Aiven is migrated and deterministically seeded; Redis Cloud contains the BullMQ queues and reconciliation scheduler. Railway still needs the updated code and service variables.
- **Application code:** Runtime PostgreSQL pools now handle Aiven's CA-less `sslmode=require` explicitly without disabling TLS globally, remote seeding has a bounded 30-second transaction, and stable BullMQ job IDs are colon-free.
- **Runtime services:** Aiven contains 4 applied migrations and the verified Aurora Retail sample dataset. Redis Cloud is reachable with six queue namespaces, one delayed reconciliation job, and one scheduler. The bootstrap worker was stopped and port 4001 is closed.
- **Local runtime:** The Next.js frontend is running on port 3000 and the Fastify API is running on port 4000. API liveness, PostgreSQL/Redis readiness, and the Reported Issues route were verified successfully on 2026-08-27.
- **Current blocker:** Redis Cloud reports `volatile-lru`; it must use `no eviction` before BullMQ state is considered reliable. Hosted API/worker deployment and public readiness remain unverified.
- **Exact next action:** Change Redis Cloud's Data eviction policy to `no eviction`, deploy the updated API/worker code and fresh variables to Railway, then verify API `/health/live`, API `/health`, and worker `/health`.

## Step overview

| Step | Name                                             | State             |
| ---: | ------------------------------------------------ | ----------------- |
|    0 | Planning and operating documents                 | Complete          |
|    1 | Workspace foundation                             | Complete          |
|    2 | Database schema and deterministic seed data      | Complete          |
|    3 | Read-only product API                            | Complete          |
|    4 | Dashboard and Reported Issues frontend           | Complete          |
|    5 | Razorpay Test Mode ingestion                     | Partially blocked |
|    6 | Deterministic diagnosis engine                   | Complete          |
|    7 | AI proposal and deterministic policy engine      | Complete          |
|    8 | BullMQ recovery orchestration                    | Complete          |
|    9 | Recovery execution tools                         | Awaiting approval |
|   10 | Simulator and evaluation harness                 | Complete          |
|   11 | Reliability, security, and end-to-end validation | Complete          |
|   12 | Deployment and hackathon demo package            | In progress       |

## Available local tooling observed

- Node.js `v22.18.0`
- npm `10.9.3`
- pnpm `10.33.0`
- Docker `27.4.0`
- Redis server `7.2.7`
- PostgreSQL CLI was not found; Docker will provide PostgreSQL locally

These versions were observed on 2026-08-20 and should be rechecked if environment setup fails.

## Credentials status

| Credential                      | Needed in step | Status                                                   |
| ------------------------------- | -------------: | -------------------------------------------------------- |
| Local PostgreSQL URL            |              1 | Configured with Docker default                           |
| Local Redis URL                 |              1 | Configured on host port 6380                             |
| Razorpay Test Key ID and Secret |              5 | Configured and authenticated                             |
| Razorpay webhook secret         |              5 | Not created                                              |
| OpenAI API key                  |              7 | Rotated; fresh value pending in Railway worker           |
| Redis Cloud credentials         |             12 | Connected; BullMQ initialized; eviction policy pending   |
| Aiven PostgreSQL URL            |             12 | Connected, migrated, seeded, and count-verified          |
| Deployment credentials          |             12 | Vercel/Railway deployment setup exists but is unverified |

Secrets must be placed only in an untracked local environment file, never in this status document.

## Session log

Append one entry per agent session. Do not rewrite older entries except to correct an objective factual error.

### 2026-08-20 — Planning documents established

**Agent:** Codex

**Requested outcome:** Create the agent guide, README, status tracker, implementation plan, and any other foundational documents needed to ensure sequential implementation.

**Completed:**

- Read and reviewed the complete `idea.md` concept.
- Confirmed the repository initially contained only `idea.md`.
- Added the Reported Issues frontend table to the product concept.
- Added the seeded dummy-data and Test Mode labelling approach.
- Created the repository operating documents.
- Divided implementation into 13 ordered, acceptance-gated steps numbered 0–12.

**Files changed:**

- `idea.md`
- `AGENTS.md`
- `README.md`
- `PLAN.md`
- `STATUS.md`
- `DECISIONS.md`
- `.env.example`
- `.gitignore`

**Validation:**

- Documentation structure and cross-references checked.
- No application code or credentials created.

**Blockers:**

- Step 1 must not start until the user approves the plan.

**Next action:**

- Review the plan with the user, revise if requested, then mark Step 0 complete and begin Step 1 only after explicit approval.

### 2026-08-20 — Step 0 acceptance review

**Agent:** Codex

**Requested outcome:** Begin with Step 0 and preserve the agreed sequential implementation process.

**Completed:**

- Re-read the operating documents in the required order.
- Checked Step 0 deliverables against its acceptance gate.
- Confirmed agreement on MVP scope, stack, data-source labelling, seeded data, safety boundaries, and step order.
- Added Git initialization and pinned Node.js/pnpm versions to the Step 1 foundation requirements.
- Confirmed that no application code has been created.

**Files changed:**

- `PLAN.md`
- `STATUS.md`

**Validation:**

- Every Step 0 deliverable exists and is non-empty.
- The exact next action remains Step 1 workspace scaffolding after approval.
- Step 1 and all later implementation steps remain not started.

**Blockers:**

- Step 0 implementation work is complete; explicit approval is still required to mark it complete and advance to Step 1.

**Next action:**

- On user approval, change Step 0 to `Complete`, change Step 1 to `In progress`, then implement only the Step 1 foundation.

### 2026-08-20 — Project structure contract added

**Agent:** Codex

**Requested outcome:** Define a maintainable project structure with separate utilities, globals, configuration, fetchers, and separate agent/tool files when those responsibilities are implemented.

**Completed:**

- Created `PROJECT_STRUCTURE.md` with the target monorepo tree and dependency boundaries.
- Defined backend module, frontend feature, configuration, globals, fetcher, utility, and public-export conventions.
- Required every AI agent to keep orchestration in `agent.ts` and tool adapters in `tools.ts`.
- Added separate prompt, schema, and type files to the recovery-agent contract.
- Updated the agent reading order, Step 0 deliverables, Step 1 structure gate, Step 7 agent deliverables, README index, and decision ledger.
- Kept the rule that folders and files are created only when they have an actual responsibility.

**Files changed:**

- `PROJECT_STRUCTURE.md`
- `AGENTS.md`
- `README.md`
- `PLAN.md`
- `DECISIONS.md`
- `STATUS.md`

**Validation:**

- The structure contract is linked from both the agent guide and project README.
- The plan now enforces the structure during workspace and agent implementation.
- No application code or empty placeholder directories were created.

**Blockers:**

- Step 0 remains awaiting approval before Step 1 may begin.

**Next action:**

- On user approval, mark Step 0 complete, begin Step 1, and create only the foundation files required by that step.

### 2026-08-20 — Step 1 workspace foundation implemented

**Agent:** Codex

**Requested outcome:** Approve Step 0, implement Step 1, and add a Husky pre-commit hook.

**Completed:**

- Marked Step 0 complete and Step 1 active.
- Preserved the existing `main` Git repository and `origin/main` remote.
- Pinned Node.js 22.18.0, pnpm 10.33.0, dependency versions, and the pnpm lockfile.
- Created the Next.js web app, Fastify API, and long-running BullMQ worker shells.
- Created shared config, database, domain, and Razorpay configuration packages.
- Added typed, dependency-aware API and worker health endpoints.
- Added Docker Compose PostgreSQL and project-isolated Redis services.
- Added formatting, ESLint, TypeScript, Vitest, production-build, and development scripts.
- Added Husky with lint-staged ESLint and Prettier checks.
- Used a narrow pnpm dependency build-script allowlist for esbuild.
- Kept payment, recovery, AI, Prisma schema, and seeded-data logic out of Step 1.

**Files changed:**

- Root workspace, package-manager, lint, formatting, Husky, environment, and Docker configuration
- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/config`
- `packages/database`
- `packages/domain`
- `packages/razorpay`
- `README.md`, `PLAN.md`, `STATUS.md`, and `DECISIONS.md`

**Validation:**

- `pnpm install --frozen-lockfile --offline` passed.
- `pnpm format:check` passed.
- `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed across all packages and applications.
- `pnpm test` passed: 3 test files and 5 tests; packages without behavior exited successfully with no tests.
- `pnpm build` passed for shared packages, API, worker, and the statically rendered Next.js web shell.
- Docker Compose configuration validated.
- PostgreSQL 17 and Redis 7.4 containers reported healthy.
- API `/health` returned HTTP 200 with PostgreSQL and Redis both `up`.
- Worker `/health` returned HTTP 200 with PostgreSQL and Redis both `up`.
- Web `/` returned the RecoveryOS Step 1 page.
- Husky's pre-commit hook passed against a temporarily staged TypeScript file, which was then unstaged.
- Git ignore rules exclude local environment files, dependencies, build output, logs, and test artifacts.

**Issues handled:**

- Downgraded ESLint 10 to the latest compatible ESLint 9 release after peer checks exposed unsupported Next.js plugins.
- Scoped Next.js ESLint rules to the web app so backend packages use TypeScript rules without React or pages warnings.
- Switched the production web build to supported Webpack mode after Turbopack could not bind a temporary CSS-helper port in the sandbox.
- Moved project Redis to host port 6380 because an unrelated local Redis already owns port 6379.
- Separated production TypeScript build configs from typecheck configs and restricted Vitest to `src` after compiled tests were initially counted twice.
- Stopped all RecoveryOS development processes and Docker containers after verification; confirmed ports 3000, 4000, 4001, 5432, and 6380 were closed while preserving named volumes.

**Blockers:**

- No implementation blocker remains. Step 2 requires explicit user approval.

**Next action:**

- On approval, mark Step 1 complete, mark Step 2 in progress, and implement the Prisma schema plus deterministic PostgreSQL seed data only.

### 2026-08-20 — Step 1 work organized into focused commits

**Agent:** Codex

**Requested outcome:** Commit the Step 1 work in categories based on each file's responsibility.

**Completed:**

- Created the `codex/step-1-foundation` branch from `main`.
- Split the work into focused commits for workspace tooling, shared packages, web, API, worker, local infrastructure, and project documentation.
- Kept all commits local; nothing was pushed.

**Files changed:**

- `STATUS.md`

**Validation:**

- Husky and lint-staged passed for every categorized commit.
- Inspected the final commit history and working-tree state.

**Blockers:**

- None. Step 1 still requires explicit user approval before Step 2 begins.

**Next action:**

- Review the categorized commits, then either request a push or approve Step 1 and start Step 2 separately.

### 2026-08-20 — Step 2 schema and deterministic seed

**Agent:** Cursor Grok 4.6

**Requested outcome:** Implement Plan Step 2 after approving Step 1.

**Completed:**

- Marked Step 1 complete and implemented only the Step 2 database schema and seed.
- Added Prisma 7 to `@recoveryos/database` with models for Merchant, Customer, PaymentEvent, RecoveryCase, RecoveryAction, AuditEvent, RecoveryPolicy, and SimulationRun.
- Added shared domain enums for case state, action type, policy decision, failure category, and data source.
- Added a deterministic seed for Aurora Retail covering recovered, waiting, stopped, escalated, exhausted, and Razorpay API retry-failure cases.
- Stored amounts as integer paise and labelled every seeded case `SIMULATED`.

**Files changed:**

- `packages/database` Prisma schema, migration, seed, client factory, and tests
- `packages/domain` recovery and payment enums
- Root workspace scripts, pnpm catalog, ignore rules, README, PLAN, STATUS, and DECISIONS

**Validation:**

- `pnpm format:check` passed.
- `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed.
- `pnpm test` passed, including 11 database tests for enum alignment, uniqueness, foreign keys, and seed idempotency.
- `pnpm build` passed.
- `pnpm db:seed` twice produced 1 merchant and the same 7 cases: RC-1001 recovered ₹4,999, plus waiting, stopped, exhausted, escalated, and retry-failure rows.

**Blockers:**

- No implementation blocker remains. Step 3 requires explicit user approval.

**Next action:**

- On approval, mark Step 2 complete, mark Step 3 in progress, and implement the read-only product API only.

### 2026-08-20 — Step 2 work organized into focused commits

**Agent:** Cursor Grok 4.6

**Requested outcome:** Commit the Step 2 work in categories based on each file's responsibility.

**Completed:**

- Created the `codex/step-2-database` branch from `main`.
- Split the work into focused commits for domain contracts, workspace Prisma tooling, schema/client, deterministic seed, and project documentation.
- Kept all commits local; nothing was pushed.

**Files changed:**

- `STATUS.md`

**Validation:**

- Husky and lint-staged passed for every categorized commit.
- Inspected the final commit history and working-tree state.

**Blockers:**

- None. Step 2 still requires explicit user approval before Step 3 begins.

**Next action:**

- Review the categorized commits, then either request a push or approve Step 2 and start Step 3 separately.

### 2026-08-21 — Step 3 read-only product API

**Agent:** Codex

**Requested outcome:** Approve Step 2 and implement Plan Step 3.

**Completed:**

- Marked Step 2 complete and implemented only the Step 3 read-only API scope.
- Added `GET /recovery/cases` with search, filters, amount/latest sorting, and stable pagination.
- Added `GET /recovery/cases/:id` with normalized payment facts, recovery actions, customer context, and an ordered audit timeline.
- Added `GET /analytics/overview` with reconciled KPIs, recovery funnel, failure/status/payment-method breakdowns, action performance, and the latest seeded simulation comparison.
- Added Zod request validation and a consistent error envelope for invalid input, missing cases, unknown routes, and internal failures.
- Kept raw Razorpay payloads in PostgreSQL and out of merchant-facing API responses.
- Kept every amount in integer paise and every case, action, audit item, breakdown, and aggregate tied to explicit data-source labels.
- Stopped the temporary API process after live endpoint verification; Step 4 frontend work was not started.

**Files changed:**

- `apps/api/src/app.ts`
- `apps/api/src/lib/errors.ts`
- `apps/api/src/lib/error-handler.ts`
- `apps/api/src/modules/recoveries/*`
- `apps/api/src/modules/analytics/*`
- `packages/database/src/index.ts`
- `README.md`, `PLAN.md`, `STATUS.md`, and `DECISIONS.md`

**Validation:**

- `pnpm format:check` passed.
- `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed across all packages and applications.
- `pnpm test` passed: 10 test files and 25 tests, including 8 API tests.
- API tests covered valid combined queries, invalid queries, stable pagination, amount sorting, case detail, missing cases, and exact analytics reconciliation against PostgreSQL.
- `pnpm build` passed for all packages and applications.
- The built API returned HTTP 200 for the case list, `RC-1001` detail, and analytics overview against the seeded database.
- Port 4000 had no listener after the validation process was stopped.

**Blockers:**

- No implementation blocker remains. Step 4 requires explicit user approval.

**Next action:**

- Review Step 3, then mark it complete and begin the dashboard and Reported Issues frontend only after approval.

### 2026-08-21 — Step 3 work organized into focused commits

**Agent:** Codex

**Requested outcome:** Commit the Step 3 work in categories based on each file's responsibility.

**Completed:**

- Kept the existing `codex/step-3-read-only-api` branch.
- Split the work into focused commits for shared API errors, recovery queries, overview analytics, application wiring, database-backed tests, and project documentation.
- Corrected `PLAN.md` so Step 3 consistently reads `Awaiting approval` across the project documents.
- Kept all commits local; nothing was pushed.

**Files changed:**

- `STATUS.md`

**Validation:**

- Husky and lint-staged passed for every categorized source and test commit.
- Inspected each staged file set before committing it.
- Final commit history and working-tree state were inspected after the documentation commit.

**Blockers:**

- None. Step 3 remains awaiting approval before Step 4 begins.

**Next action:**

- Review the categorized commits, then either request a push or approve Step 3 and start Step 4 separately.

### 2026-08-21 — Step 4 dashboard and Reported Issues frontend

**Agent:** Codex

**Requested outcome:** Implement Plan Step 4 and align the UI with the supplied editorial cream, navy, cobalt, and yellow references.

**Completed:**

- Added a typed, Zod-validated web API client and feature-level dashboard and recovery fetchers.
- Built the API-backed executive KPI grid, recovery funnel, failure exposure chart, strategy performance chart, and simulation comparison.
- Built the Reported Issues table with every required field, combined URL-preserving search, filters, sorting, pagination, desktop table, mobile cards, and empty/loading/error states.
- Built the recovery detail route with normalized payment evidence, diagnosis, customer context, proposed actions, policy decisions, and chronological audit trail.
- Kept simulated and Razorpay Test Mode labels visible through shared data-source badges.
- Applied the reference-led editorial visual system and removed the permanent headline highlight after user feedback.
- Added focused formatter, query-state, KPI component, table component, and empty-state tests.
- Recorded the incomplete browser comparison in `design-qa.md` without claiming visual acceptance.

**Files changed:**

- `apps/web/src/app/*`
- `apps/web/src/components/*`
- `apps/web/src/config/env.ts`
- `apps/web/src/features/dashboard/*`
- `apps/web/src/features/recoveries/*`
- `apps/web/src/lib/*`
- `apps/web/vitest.config.mts`
- `apps/web/package.json` and `pnpm-lock.yaml`
- `README.md`, `PLAN.md`, `STATUS.md`, `DECISIONS.md`, and `design-qa.md`

**Validation:**

- `pnpm format:check` passed.
- `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed across all packages and applications.
- `pnpm test` passed: 14 test files and 35 tests, including 4 frontend files and 10 frontend tests.
- `pnpm build` passed; Next.js built `/`, `/recoveries`, and `/recoveries/[id]` as dynamic server-rendered routes.
- Local HTTP checks returned success for dashboard, combined filters/sorting, empty results, recovery detail, and missing-case states against persisted PostgreSQL seed data.

**Blockers:**

- The in-app browser is not connected, so post-fix desktop/mobile screenshots, interaction checks, console inspection, and the required combined source-to-implementation comparison could not be completed.

**Next action:**

- Connect an in-app browser, finish the browser/design QA acceptance gate, then request explicit Step 4 approval before Step 5.

### 2026-08-21 — Step 4 approved for commit

**Agent:** Codex

**Requested outcome:** Accept Step 4 and commit its implementation.

**Completed:**

- Marked Step 4 complete after explicit user approval.
- Retained the unavailable in-app browser comparison as a known validation limitation rather than rewriting the blocked QA evidence.
- Kept Step 5 not started and preserved its credential-first implementation instruction.
- Organized the Step 4 working tree into focused commits by responsibility.

**Files changed:**

- `PLAN.md`
- `README.md`
- `STATUS.md`
- Step 4 frontend, tests, dependency metadata, visual decision, and QA files listed in the preceding session entry

**Validation:**

- Categorized commits passed the configured Husky and lint-staged checks.
- Final local commit history and working-tree state were inspected.

**Blockers:**

- None for Step 4 approval. Browser-based design comparison remains unavailable and documented in `design-qa.md`.

**Next action:**

- Wait for explicit approval before starting Step 5 Razorpay Test Mode ingestion.

### 2026-08-21 — Step 5 Razorpay Test Mode ingestion

**Agent:** Cursor Grok 4.6

**Requested outcome:** Inspect operating docs after Step 4 completion and implement Step 5 Razorpay Test Mode ingestion.

**Completed:**

- Confirmed Steps 0–4 are complete and started Step 5 only.
- Added a `WebhookEvent` table and migration for raw signed payload persistence.
- Added Razorpay webhook signature verification, Test Mode order client, and payload mappers.
- Added `POST /webhooks/razorpay` with raw-body verification, event-id idempotency, fast ACK, and BullMQ enqueue.
- Added worker processing that creates `RAZORPAY_TEST_MODE` recovery cases without duplicating retries.
- Added `/demo/checkout` and demo order APIs. Live checkout remains blocked until Test Mode keys are added locally.

**Files changed:**

- `packages/database/prisma/schema.prisma` and `packages/database/prisma/migrations/20260821065049_add_webhook_events/`
- `packages/domain/src/queues.ts`, `packages/domain/src/webhooks.ts`
- `packages/razorpay/src/*`
- `apps/api/src/modules/webhooks/razorpay/*`, `apps/api/src/modules/demo/razorpay/*`, `apps/api/src/app.ts`
- `apps/worker/src/jobs/process-payment-event.ts`, `apps/worker/src/worker.ts`
- `apps/web/src/app/demo/checkout/page.tsx`, `apps/web/src/features/demo-checkout/*`
- `README.md`, `PLAN.md`, `STATUS.md`, `DECISIONS.md`

**Validation:**

- `pnpm format` then `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed.
- `pnpm test` passed, including signed webhook reject/accept/duplicate tests and worker ingest idempotency.
- `pnpm build` passed; Next.js includes `/demo/checkout`.
- Live Razorpay Test Mode checkout was not run because local credentials are empty.

**Blockers:**

- `RAZORPAY_TEST_MODE_API_KEY` and `RAZORPAY_TEST_MODE_SECRET_KEY` are configured; the optional `RAZORPAY_WEBHOOK_SECRET` is not configured.
- Razorpay cannot deliver webhooks to `localhost`; a public HTTPS URL is required for the live acceptance check.

**Next action:**

- Add Test Mode keys from the Razorpay dashboard, configure `POST /webhooks/razorpay`, trigger `failure@razorpay`, and confirm a `RAZORPAY_TEST_MODE` row before marking Step 5 complete.

### 2026-08-21 — Step 6 deterministic diagnosis engine

**Agent:** Codex

**Requested outcome:** Implement Step 6 while the live Razorpay credential check from Step 5 remains blocked.

**Completed:**

- Advanced Step 6 by explicit user instruction without marking Step 5's live acceptance check complete.
- Added the pure `@recoveryos/recovery-engine` package with deterministic classification, recoverability scoring, evidence, customer-contact safety, and bounded fallback recommendations.
- Covered merchant errors, customer authentication, insufficient funds, gateway transients, network failures, issuer failures, unknown signals, and repeated unknown attempts.
- Wired diagnosis into Test Mode payment-event processing using the stored order attempt count.
- Persisted normalized case fields and a `diagnosis.completed` audit event containing evidence, score, band, contact guardrail, and recommended fallback.
- Exposed stored diagnosis metadata through the recovery detail API and displayed it in the case detail UI.
- Kept deterministic recommendations visibly separate from later AI proposals and policy decisions.
- Serialized workspace suites and API integration files after repeated full runs exposed shared demo-database reseed races.

**Files changed:**

- `packages/recovery-engine/*`
- `apps/worker/package.json`
- `apps/worker/src/jobs/process-payment-event.ts`
- `apps/worker/src/jobs/process-payment-event.test.ts`
- `apps/api/src/modules/recoveries/mappers.ts`
- `apps/api/src/modules/recoveries/mappers.test.ts`
- `apps/api/src/modules/recoveries/routes.test.ts`
- `apps/web/src/features/recoveries/schemas.ts`
- `apps/web/src/features/recoveries/components/diagnosis-evidence.tsx`
- `apps/web/src/features/recoveries/components/diagnosis-evidence.test.tsx`
- `apps/web/src/features/recoveries/components/recovery-detail.tsx`
- `apps/web/src/features/recoveries/components/recovery-detail.module.css`
- Root workspace dependency, test-runner, lockfile, and project tracking documents

**Validation:**

- `pnpm format:check` passed.
- `pnpm lint` passed with zero warnings across all packages and applications.
- `pnpm typecheck` passed.
- `pnpm test` passed: 24 test files and 58 tests.
- The diagnosis package passed 10 table-driven and fallback tests.
- Worker integration tests proved stored gateway evidence and merchant escalation without customer contact.
- API and frontend tests proved stored diagnosis evidence is returned and rendered.
- `pnpm build` passed, including the new recovery-engine package and all application routes.

**Issues handled:**

- Full workspace runs exposed both cross-workspace and intra-API parallel suites reseeding the same PostgreSQL demo merchant. The root runner now serializes workspaces and the API disables file parallelism for database integration tests.

**Blockers:**

- Step 6 has no implementation blocker and awaits user approval.
- Step 5's real Test Mode acceptance event remains blocked on credentials and a public HTTPS webhook endpoint.

**Next action:**

- Review Step 6, then approve it before any Step 7 AI or policy implementation begins.

### 2026-08-21 — Step 7 AI proposal and deterministic policy engine

**Agent:** Codex

**Requested outcome:** Implement Step 7 and use GPT-5.6 Terra for the API-backed recovery proposal when needed.

**Completed:**

- Treated the Step 7 instruction as approval of Step 6 and advanced only the requested step.
- Added `@recoveryos/agents` with separate `agent.ts`, `tools.ts`, `prompt.ts`, `schemas.ts`, and `types.ts` responsibilities.
- Added a strict Zod-validated Responses API proposal using configurable `gpt-5.6-terra`, with no model tools or side-effect access.
- Bounded each new-case proposal to low reasoning effort, 700 output tokens, a 12-second timeout, one SDK retry, and disabled response storage.
- Added safe deterministic fallback for missing, failed, or invalid model responses.
- Added pure policy checks for captured payments, action limits, message limits, cooldowns, recovery windows, opt-out, diagnosis contact safety, duplicate work, allowed actions, and merchant failures.
- Persisted the proposal, model/fallback source, evidence, approval or denial, violations, safe fallback, and reasoning in `RecoveryAction` and audit events.
- Wired the agent and policy path into newly created Test Mode recovery cases without giving the LLM database-write, Razorpay, messaging, or execution tools.
- Exposed proposal and policy metadata through the existing recovery API and rendered AI source, evidence, denial reasons, scheduling, and safe fallback in case details.

**Files changed:**

- `packages/agents/*`
- `packages/recovery-engine/src/policy/*`
- `apps/worker/src/agents/recovery-context.ts`
- `apps/worker/src/jobs/analyse-recovery.ts`
- Worker configuration, startup, ingestion integration, and tests
- Recovery API mappers and tests
- Recovery case-detail schemas, action component, styles, and tests
- Workspace dependency, lockfile, environment example, and project tracking documents

**Validation:**

- A live synthetic Responses API smoke call returned a schema-valid `OPENAI` proposal from `gpt-5.6-terra` without fallback.
- `pnpm lint` passed with zero warnings across all packages and applications.
- `pnpm typecheck` passed.
- `pnpm test` passed: 27 test files and 78 tests.
- Policy tests cover all required prohibitions and prove merchant-side failures cannot trigger customer-facing recovery.
- Worker integration tests prove approved proposals and policy-denied merchant proposals are stored once with complete audit events.
- API and frontend tests prove proposal source, evidence, policy violations, and safe fallback are returned and rendered.
- `pnpm build` passed, including the new agents package and all application routes.

**Issues handled:**

- Kept Payment Link creation distinct from customer messaging: a delayed link may be created after policy cooldown without contacting the customer, while reminders and alternate-method outreach remain consent-gated.

**Blockers:**

- Step 7 has no implementation blocker and awaits user approval.
- Step 5's real Test Mode acceptance event remains blocked on Razorpay credentials and a public HTTPS webhook endpoint.

**Next action:**

- Review and approve Step 7 before beginning Step 8 BullMQ recovery orchestration.

### 2026-08-21 — Step 8 BullMQ recovery orchestration

**Agent:** Cursor Grok 4.6

**Requested outcome:** Implement Step 8 while a parallel agent works on Step 9 execution tools.

**Completed:**

- Added queues for payment events, analysis, recovery actions, verification, and reconciliation.
- Delayed approved actions until `scheduledFor`, with bounded exponential retry and stable job IDs.
- Persisted `RecoveryJob` records for failed/exhausted visibility and structured worker logs.
- Executed WAIT/STOP/ESCALATE in orchestration and left Payment Link/reminder/alternative-method tools behind an injected `RecoveryActionExecutor` for Step 9.
- Added a repeatable reconciliation job so overdue work is recovered without an external cron.

**Files changed:**

- `packages/domain/src/queues.ts`
- `packages/recovery-engine/src/idempotency/*`, `packages/recovery-engine/src/execution/types.ts`
- `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260821120000_add_recovery_jobs/`
- `apps/worker/src/queues/*`, `apps/worker/src/jobs/execute-recovery.ts`, `verify-recovery.ts`, `reconcile-recovery.ts`, `track-job.ts`, `process-analysis-job.ts`, `worker.ts`
- `apps/api/src/app.ts`
- `PLAN.md`, `STATUS.md`, `README.md`, `DECISIONS.md`

**Validation:**

- `pnpm --filter @recoveryos/worker typecheck` passed.
- `pnpm --filter @recoveryos/worker lint` and related package lints passed.
- `pnpm --filter @recoveryos/recovery-engine test` passed (25 tests).
- `pnpm --filter @recoveryos/worker test` passed (9 tests), including transient-tool retry without duplicate actions, exhausted-job audit, and Redis job survival after the producer closed.

**Blockers:**

- Step 9 must attach `RecoveryActionExecutor` for CREATE_PAYMENT_LINK, SEND_REMINDER, and ALTERNATIVE_METHOD or those jobs retry until exhausted.
- Step 5 live Test Mode acceptance remains blocked on credentials and a public webhook URL.

**Next action:**

- Review and approve Step 8. Let the parallel Step 9 agent implement execution tools against `RecoveryActionExecutor`.

### 2026-08-21 — Step 9 execution integration and credential normalization

**Agent:** Codex

**Requested outcome:** Integrate Step 9 after the parallel Step 8 agent finished, use the supplied Test Mode credential names throughout, and create categorized commits.

**Completed:**

- Preserved and integrated the completed Step 8 BullMQ orchestration work.
- Replaced all legacy Razorpay API credential references with `RAZORPAY_TEST_MODE_API_KEY` and `RAZORPAY_TEST_MODE_SECRET_KEY` across API, worker, checkout UI, environment example, and documentation.
- Removed obsolete empty legacy entries from the untracked local `.env` while leaving its configured Test Mode values untouched.
- Added modular Razorpay HTTP, order, payment, and Payment Link adapters.
- Attached Step 9 through Step 8's `RecoveryActionExecutor` and verification-worker interfaces.
- Re-checked payment state before every runtime action and skipped every side effect when the provider reported `CAPTURED`.
- Added silent, action-bound Payment Link creation with lookup-before-create idempotency.
- Kept reminders and alternative-method outreach simulated and routed wait, stop, and escalation through durable workflow execution.
- Added Payment Link recovery reconciliation through both API state and `payment_link.paid` webhooks.
- Preserved AI proposal/policy metadata when execution output is added to an action.

**Files changed:**

- Step 8 database, domain, recovery-engine, queue, job, and worker runtime files
- `packages/razorpay/src/*`
- `apps/worker/src/tools/*`, execution and outcome jobs, worker registration, and integration tests
- API/worker environment configuration, API startup, checkout copy, `.env.example`, and project records

**Validation:**

- Read-only Razorpay API authentication passed using only the two configured `RAZORPAY_TEST_MODE_*` variables; no provider object was created.
- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` passed.
- `pnpm test` passed: 33 test files and 93 tests.
- Worker integration tests passed: 7 files and 15 tests, including Redis restart survival, queue retry/exhaustion, captured-payment suppression, API recovery, and paid-link webhook recovery.
- `pnpm build` passed for all packages and applications.

**Blockers:**

- One Payment Link still needs to be created and paid in Test Mode to complete the live Step 9 acceptance gate.
- Signed webhook delivery remains optional and requires a separate webhook secret plus a public HTTPS endpoint.

**Next action:**

- Review the categorized commits, then run one live paid-link recovery and approve Step 9 before Step 10.

### 2026-08-21 — Step 10 deterministic simulator and evaluation harness

**Agent:** Codex

**Requested outcome:** Implement Step 10 after the Step 8 and Step 9 integration work was available.

**Completed:**

- Added a pure `@recoveryos/simulator` package with a seeded 250–500 failed-payment generator, evaluator-only hidden recovery probabilities, and no-intervention, naive-retry, and RecoveryOS strategies.
- Used one deterministic outcome roll per payment across all three strategies so comparisons are reproducible and fair without exposing hidden probabilities to strategy inputs.
- Calculated revenue at risk, recovered and incremental revenue, recovery rate, attempts, average attempts, false interventions, policy stops, and simulated customer contacts from individual outcomes.
- Added `POST /simulator/run` with validated inputs and persisted idempotent runs keyed by merchant, seed, and configuration hash.
- Added durable `SimulationOutcome` records for every payment and strategy, including visible inputs and explicit `SIMULATED` labels.
- Extended dashboard analytics and the simulation panel with the no-intervention baseline, customer-contact count, and explicit simulated-money copy.
- Documented the package boundary, endpoint, repeatability contract, architectural decision, and intentional limitation that the harness does not make hundreds of live OpenAI calls.
- Corrected the already-present Step 11 rate-limit error adapter and isolated webhook/e2e test state when the full workspace validation exposed those test defects.

**Files changed:**

- `packages/simulator/*`
- `packages/database/prisma/schema.prisma`, the Step 10 migration, and deterministic seed files
- `apps/api/src/modules/simulator/*`, API composition, and analytics repository/types
- Dashboard response schema and simulation comparison component
- `README.md`, `PLAN.md`, `STATUS.md`, `DECISIONS.md`, `PROJECT_STRUCTURE.md`, and `LIMITATIONS.md`

**Validation:**

- Default seed `20260821` produced 500 payments and ₹28.76 lakh at risk; no intervention recovered 11.8%, naive retry 18.0%, and RecoveryOS 45.2%, for ₹7.84 lakh incremental recovery over naive retry.
- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` passed.
- `pnpm test` passed: 39 test files and 108 tests, including deterministic reproduction, aggregate reconciliation, hidden-input isolation, API persistence, and all prior suites.
- `pnpm build` passed for every package and application.
- `pnpm db:setup` generated the Prisma client, confirmed all migrations applied, and reseeded 7 deterministic recovery cases.
- No API, web, or worker development server was left running; only the Docker PostgreSQL and Redis services remain active.

**Blockers:**

- Step 10 has no implementation blocker. Step 9 still needs one real Test Mode Payment Link to be created and paid for its live acceptance gate.
- Signed webhook delivery still needs a separate webhook secret and public HTTPS endpoint.

**Next action:**

- Review and approve Step 10. After approval, decide whether to approve the already implemented Step 11 or complete the pending live Razorpay checks first.

### 2026-08-21 — Step 11 reliability, security, and e2e

**Agent:** Cursor Grok 4.6

**Requested outcome:** Implement Step 11 — reliability, security, and end-to-end validation.

**Completed:**

- Added Helmet secure headers and in-process API rate limits, with health checks unrestricted and a `RATE_LIMIT_EXCEEDED` envelope.
- Redacted secrets, signatures, and payment identifiers from API logs and worker job-error logs.
- Mapped Razorpay 5xx responses to retried executions, wrote `recovery.execution.failed` into the audit timeline, and reused the action-bound Payment Link reference so retries cannot create duplicates.
- Added coverage for malformed signed webhooks, captured-payment suppression, AI/policy failures (existing suites), Redis job survival after a producer restart, and an end-to-end primary recovery flow.
- Documented known limitations in `LIMITATIONS.md` instead of hiding them.
- Serialized shared-database constraint tests and isolated the e2e case from demo reseeding so the full workspace suite stays stable.

**Files changed:**

- `apps/api/src/plugins/security.ts`, `apps/api/src/lib/logger.ts`, `apps/api/src/app.ts`
- `packages/domain/src/redact.ts`, `packages/razorpay/src/http.ts`
- `apps/worker/src/tools/map-razorpay-error.ts`, recovery tools, `execute-recovery.ts`, `track-job.ts`, `process-payment-event.ts`
- Webhook, Razorpay client, worker e2e, and security tests
- `LIMITATIONS.md`, `README.md`, `PLAN.md`, `STATUS.md`, `DECISIONS.md`

**Validation:**

- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` passed.
- `pnpm test` passed: 39 test files and 108 tests.
- `pnpm test:e2e` passed: the primary recovery flow retries a Razorpay 503, records the failure in the audit timeline, and succeeds without a duplicate Payment Link.

**Blockers:**

- Step 11 has no implementation blocker. Live signed webhooks and one paid Test Mode link remain outstanding for Steps 5 and 9.

**Next action:**

- Review and approve Step 11. Step 10 also awaits approval. Do not start Step 12 until those gates pass.

### 2026-08-21 — Header health links and RecoveryOS label

**Agent:** Cursor

**Requested outcome:** Replace the header workspace merchant name with RecoveryOS and add API and worker health links to the UI.

**Completed:**

- Replaced the header workspace label `Aurora Retail` / `Demo workspace` with `RecoveryOS`.
- Added header links to API health (`/health` on the public API URL) and worker health (`NEXT_PUBLIC_WORKER_HEALTH_URL`).
- Documented the worker health URL in `.env.example`.

**Files changed:**

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-shell.module.css`
- `apps/web/src/config/env.ts`
- `.env.example`
- `STATUS.md`

**Validation:**

- Linter diagnostics for the edited web files reported no issues.

**Blockers:**

- Unchanged: live signed webhooks and one paid Test Mode link remain outstanding for Steps 5 and 9.

**Next action:**

- Review and approve Step 11. Step 10 also awaits approval. Do not start Step 12 until those gates pass.

### 2026-08-21 — About page and architecture guide

**Agent:** Codex

**Requested outcome:** Explain RecoveryOS in plain language on the frontend and document the complete architecture, integrations, queues, worker, and cron-like scheduling.

**Completed:**

- Added a public `/about` page explaining the failed-payment recovery problem, six-stage recovery loop, integrated services, and AI safety boundary.
- Added a responsive architecture diagram to the frontend covering Next.js, Fastify, Razorpay Test Mode, PostgreSQL/Prisma, Redis/BullMQ, the recovery worker, GPT-5.6 Terra, deterministic policy, execution tools, verification, and audit history.
- Clarified that reconciliation uses a BullMQ repeatable scheduler every 60 seconds and requires a continuously running worker, but no external cron service or dedicated VM.
- Added `ARCHITECTURE.md` with Mermaid system and queue diagrams, an integration responsibility table, and the main security and reliability boundaries.
- Added the About link to the shared header and documented the new route and feature structure.

**Files changed:**

- `apps/web/src/app/about/*`
- `apps/web/src/features/about/*`
- `apps/web/src/components/app-shell.tsx` and `app-shell.module.css`
- `ARCHITECTURE.md`, `README.md`, `PLAN.md`, `STATUS.md`, `DECISIONS.md`, and `PROJECT_STRUCTURE.md`

**Validation:**

- Frontend lint and TypeScript checks passed.
- All 14 frontend tests passed, including the new About-page content contract.
- The Next.js production build passed and statically generated `/about`.
- The running frontend returned the expected About, Razorpay Test Mode, GPT-5.6 Terra, BullMQ scheduler, and no-external-cron copy from `/about`.

**Blockers:**

- This documentation work has no implementation blocker. The existing live signed-webhook and paid Test Mode Payment Link acceptance checks remain outstanding.

**Next action:**

- Review the new frontend page and architecture guide, then continue the remaining Step 12 deployment and demo-package work after approval.

### 2026-08-21 — README project guide enrichment

**Agent:** Codex

**Requested outcome:** Enrich the README using the architecture, project-structure, status, limitations, configuration, and operating documents.

**Completed:**

- Reworked the README from an implementation-era outline into the primary project entry point for judges, developers, and future agents.
- Added the problem statement, implemented demo capabilities, end-to-end recovery workflow, Mermaid architecture overview, integration responsibilities, queue and scheduler model, data ownership, and safety boundaries.
- Expanded local setup, environment-variable guidance, demo walkthroughs, API reference, AI/policy behavior, simulator design, repository structure, validation commands, and current limitations.
- Added a linked documentation map so detailed architecture, structure, planning, status, decisions, limitations, and agent rules remain easy to find without duplicating their full contents.

**Files changed:**

- `README.md`
- `STATUS.md`

**Validation:**

- README content was reconciled against `ARCHITECTURE.md`, `PROJECT_STRUCTURE.md`, `LIMITATIONS.md`, `.env.example`, root package scripts, and the current `STATUS.md` snapshot.
- Prettier formatting and repository diff checks passed.

**Blockers:**

- None for the README work. Existing live webhook and paid Test Mode Payment Link acceptance items remain unchanged.

**Next action:**

- Review the enriched README, then continue the remaining Step 12 deployment and demo-package work after approval.

### 2026-08-21 — README queue Mermaid diagram

**Agent:** Codex

**Requested outcome:** Add the Mermaid architecture chart directly to the README.

**Completed:**

- Retained the README's system-level Mermaid architecture overview.
- Added a second Mermaid flowchart showing all five BullMQ queues, the recovery worker, PostgreSQL, and the 60-second reconciliation paths for stale webhooks, missing analysis, and overdue approved actions.

**Files changed:**

- `README.md`
- `STATUS.md`

**Validation:**

- Prettier formatting and repository diff checks passed.

**Blockers:**

- None for this documentation change.

**Next action:**

- Review the rendered Mermaid diagrams on GitHub, then continue the remaining Step 12 work after approval.

### 2026-08-21 — Remove deprecated web tsconfig baseUrl

**Agent:** Cursor

**Requested outcome:** Fix the TypeScript 6 `baseUrl` deprecation error in `apps/web/tsconfig.json`.

**Completed:**

- Removed deprecated `compilerOptions.baseUrl` from the web TypeScript config.
- Kept the `@/*` path mapping, which already included the `./src/*` prefix relative to the config file.

**Files changed:**

- `apps/web/tsconfig.json`
- `STATUS.md`

**Validation:**

- `pnpm --filter @recoveryos/web typecheck` passed (`tsc --noEmit` exit 0).
- IDE diagnostics for `apps/web/tsconfig.json` reported no issues.

**Blockers:**

- Unchanged: live signed webhooks remain outstanding for Step 5.

**Next action:**

- Continue remaining Step 12 deployment and demo-package work.

### 2026-08-21 — Vercel web and Railway runtime split

**Agent:** Cursor

**Requested outcome:** Guide and prepare Vercel deployment for the web app, while leaving PostgreSQL and Razorpay webhook work for tomorrow.

**Completed:**

- Recorded D-034: Vercel hosts Next.js; Railway hosts the Fastify API, BullMQ worker, PostgreSQL, and Redis.
- Added `apps/web/vercel.json` and Vercel-aware `APP_BASE_URL` defaulting.
- Added Railway Dockerfiles for the API and worker, plus `PORT` listen fallbacks so hosted services bind the platform port.
- Documented tonight/tomorrow deploy steps in `README.md`.

**Files changed:**

- `apps/web/vercel.json`, `apps/web/package.json`, `apps/web/src/config/env.ts`
- `apps/api/src/config/env.ts`, `apps/api/src/server.ts`
- `apps/worker/src/config/env.ts`, `apps/worker/src/worker.ts`
- `deploy/Dockerfile.api`, `deploy/Dockerfile.worker`, `.dockerignore`
- `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PLAN.md`, `LIMITATIONS.md`, `.env.example`, `.gitignore`, `STATUS.md`

**Validation:**

- `pnpm --filter @recoveryos/web typecheck` passed.
- `pnpm --filter @recoveryos/api typecheck` passed.
- `pnpm --filter @recoveryos/worker typecheck` passed.

**Blockers:**

- Hosted Postgres, Redis, API, worker, and a public Razorpay webhook URL are not created yet.

**Next action:**

- Push `main` and import the repo into Vercel with Root Directory `apps/web`. Tomorrow: Railway Postgres/Redis/API/worker, then the webhook.

### 2026-08-21 — Railway API health-check port fix

**Agent:** Codex

**Requested outcome:** Diagnose the Railway API deployment that built successfully but never passed `/health`.

**Completed:**

- Traced the Docker start command, Fastify listener, environment parsing, health route, PostgreSQL check, and Redis check.
- Identified the deployed `API_PORT=4000` variable as conflicting with Railway's injected `PORT`, which Railway also uses for deployment health checks.
- Changed API and worker configuration so platform `PORT` takes precedence over local-only port overrides.
- Documented the Railway troubleshooting step, service-specific environment guidance, and the durable port-precedence decision.

**Files changed:**

- `apps/api/src/config/env.ts`
- `apps/worker/src/config/env.ts`
- `README.md`
- `DECISIONS.md`
- `STATUS.md`

**Validation:**

- API and worker lint, TypeScript checks, and production builds passed.
- Direct built-module checks with both variables set confirmed that the API selected platform `PORT=12345` over `API_PORT=4000` and the worker selected platform `PORT=12346` over `WORKER_HEALTH_PORT=4001`.
- Four dependency-free API test files and 8 tests passed; three database-backed files could not start because local PostgreSQL was not running (`ECONNREFUSED` on port 5432). This was an unavailable test dependency, not a failing port assertion.
- Repository formatting and diff checks passed.
- Railway's current documentation confirms that it injects `PORT`, uses the same value for deployment health checks, and reports `service unavailable` when the application listens elsewhere.

**Blockers:**

- The Railway API variable `API_PORT` must still be removed and the service redeployed from the updated commit.
- If `/health` then returns JSON with a degraded dependency, inspect the returned `dependencies.postgres.error` or `dependencies.redis.error` and the deployment logs.

**Next action:**

- Remove `API_PORT`, change `NODE_ENV` to `production`, deploy the updated commit, and confirm the public `/health` endpoint returns HTTP 200.

### 2026-08-21 — Railway private database seeding correction

**Agent:** Codex

**Requested outcome:** Seed the Railway PostgreSQL database using the provided connection information.

**Completed:**

- Declined to use or repeat the exposed credential and identified `postgres.railway.internal` as a Railway private-network hostname that is not reachable from a laptop.
- Replaced the README's laptop-seeding instruction with a Railway-native pre-deploy procedure.
- Documented `pnpm db:setup` as the one-time initial migration and seed command, followed by `pnpm db:migrate` for normal deployments so demo state is not reset each time.
- Recorded the private-network deployment decision and credential-rotation requirement.

**Files changed:**

- `README.md`
- `DECISIONS.md`
- `STATUS.md`

**Validation:**

- Confirmed the referenced root database scripts against `package.json` and the Prisma package scripts.
- Railway's current pre-deploy documentation confirms that these commands run inside the private network with application environment variables and are intended for migrations and data seeding.
- Repository formatting and diff checks were run.

**Blockers:**

- The exposed PostgreSQL credential must be rotated in Railway before it is used.
- The API deployment and initial private-network seed still need to be run from the updated Railway configuration.

**Next action:**

- Rotate the PostgreSQL credentials, set `pnpm db:setup` as the API pre-deploy command, remove `API_PORT`, use `NODE_ENV=production`, and redeploy.

### 2026-08-21 — Railway liveness and readiness separation

**Agent:** Codex

**Requested outcome:** Resolve the Railway API network health-check failure after the image, database migration, and seed completed successfully.

**Completed:**

- Confirmed locally that the production API listens on Railway-style `PORT` and that the strict `/health` endpoint returns HTTP 503 when a dependency is unavailable.
- Added `/health/live`, which returns HTTP 200 as soon as Fastify is accepting requests without waiting on PostgreSQL or Redis.
- Retained `/health` as the strict readiness endpoint with per-dependency status and errors.
- Exempted both health endpoints from rate limiting and added focused liveness/security tests.
- Updated the Railway deployment guide and recorded the liveness/readiness boundary.

**Files changed:**

- `apps/api/src/modules/health/routes.ts` and `routes.test.ts`
- `apps/api/src/plugins/security.ts` and `security.test.ts`
- `README.md`
- `DECISIONS.md`
- `STATUS.md`

**Validation:**

- API lint, TypeScript, focused health/security tests, production build, formatting, and diff checks were run.

**Blockers:**

- Railway must deploy the updated commit and change the API deployment health-check path from `/health` to `/health/live`.
- Exposed hosted PostgreSQL and Redis credentials still require rotation.

**Next action:**

- Deploy the liveness change, verify `/health/live` returns 200, then inspect `/health` and fix whichever dependency remains degraded.

### 2026-08-27 — External Redis and split hosting configuration

**Agent:** Codex

**Requested outcome:**

- Stop using Railway-managed PostgreSQL and Redis, keep only the API and worker on Railway, support Redis Cloud credentials, and keep OpenAI configuration scoped correctly while PostgreSQL remains pending.

**Completed:**

- Added one shared, pure Redis connection resolver that accepts either `REDIS_URL` or component variables and percent-encodes credentials.
- Made a configured `REDIS_URL` take precedence and added explicit TLS selection through `REDIS_TLS`.
- Updated API and worker environment parsing to produce the same canonical `REDIS_URL` for existing BullMQ and health-check code.
- Kept `OPENAI_API_KEY` in the worker configuration only.
- Updated deployment, architecture, limitations, plan, environment, and project-structure documentation for Railway compute plus externally managed Redis and PostgreSQL.
- Recorded D-038, which supersedes D-034 only for data-store placement.
- Did not store, print, or test any supplied credential value; the user reported those values were rotated.

**Files changed:**

- `.env.example`
- `README.md`, `ARCHITECTURE.md`, `LIMITATIONS.md`, `PLAN.md`, `DECISIONS.md`, `PROJECT_STRUCTURE.md`, and `STATUS.md`
- `packages/config/package.json`, `packages/config/tsconfig.json`, `packages/config/tsconfig.build.json`, and `packages/config/src/*`
- `apps/api/package.json` and `apps/api/src/config/env.ts`
- `apps/worker/package.json` and `apps/worker/src/config/env.ts`
- `pnpm-lock.yaml`

**Validation:**

- `pnpm install --frozen-lockfile` passed after refreshing workspace dependency links.
- `pnpm --filter @recoveryos/config lint` passed.
- `pnpm --filter @recoveryos/config typecheck` passed.
- `pnpm --filter @recoveryos/config test` passed: 1 file and 5 tests.
- `pnpm build:packages` passed, including Prisma client generation.
- API lint, typecheck, and production build passed.
- Worker lint, typecheck, and production build passed.
- Repository formatting and diff checks passed.

**Blockers:**

- The external managed PostgreSQL provider and `DATABASE_URL` are still pending.
- Fresh Redis and OpenAI values must be configured directly in Railway rather than shared in chat or committed.
- Live Redis connectivity and hosted runtime readiness cannot be verified until those fresh provider values are installed.

**Next action:**

- Enter the fresh secrets and external `DATABASE_URL` directly in both applicable Railway services and redeploy using `/health/live` for API liveness and `/health` for dependency readiness.

### 2026-08-27 — Aiven PostgreSQL and connection budgeting

**Agent:** Codex

**Requested outcome:**

- Update the external PostgreSQL deployment for the selected Aiven service after the disclosed credentials were rotated.

**Completed:**

- Confirmed that the existing Prisma 7 `@prisma/adapter-pg` and direct `pg` clients accept a PostgreSQL service URI containing `sslmode=require`.
- Selected Aiven as the Step 12 PostgreSQL provider without storing its service hostname, port, username, password, certificate, or complete URI.
- Added `DATABASE_POOL_MAX`, defaulting to three Prisma connections per API/worker runtime.
- Limited each independent PostgreSQL health-check pool to one connection.
- Budgeted one API plus one worker replica for at most eight normal runtime connections against the stated 20-connection service limit.
- Updated deployment, architecture, limitations, plan, environment, and decision documentation for Aiven TLS and connection budgeting.
- Recorded D-039.

**Files changed:**

- `.env.example`
- `README.md`, `ARCHITECTURE.md`, `LIMITATIONS.md`, `PLAN.md`, `DECISIONS.md`, and `STATUS.md`
- `packages/database/src/client.ts`, `client.test.ts`, `prisma.ts`, and `index.ts`
- `apps/api/src/config/env.ts` and `app.ts`
- `apps/worker/src/config/env.ts` and `worker.ts`

**Validation:**

- `pnpm --filter @recoveryos/database lint` passed.
- Focused database pool tests passed: 1 file and 2 tests.
- Database typecheck and production build passed, including Prisma 7.9.1 client generation.
- API lint, typecheck, and production build passed.
- Worker lint, typecheck, and production build passed.
- The exact transitive production build graphs used by both Railway Dockerfiles passed: `pnpm --filter @recoveryos/api... build` and `pnpm --filter @recoveryos/worker... build`.
- Repository formatting and diff checks passed.

**Blockers:**

- The newly rotated Aiven URI must be entered directly as `DATABASE_URL` in both Railway services.
- Live Aiven migrations, seed, and readiness were not attempted with the disclosed credential.

**Next action:**

- Set the rotated provider values directly in Railway, run `pnpm db:setup` once, redeploy both runtimes, and check API `/health/live`, API `/health`, and worker `/health`.

### 2026-08-27 — External sample-data readiness audit

**Agent:** Codex

**Requested outcome:**

- Inspect the schema and populate PostgreSQL and Redis with sample data.

**Completed:**

- Confirmed that the deterministic PostgreSQL seed owns sample merchant, policy, customer, payment, recovery-case, action, audit, and simulator data.
- Preserved Redis as BullMQ queue, retry, delayed-job, and repeatable-scheduler state rather than duplicating business records as arbitrary keys.
- Inspected the effective untracked environment without printing any credential values.
- Confirmed that the effective PostgreSQL and precedence-winning Redis URL still point to local Docker, while separate Redis component configuration exists but is currently ignored because `REDIS_URL` wins.
- Did not connect to or mutate Aiven or Redis Cloud using credentials disclosed in chat.

**Files changed:**

- `STATUS.md`

**Validation:**

- Verified the Prisma schema contains merchant, customer, policy, payment, recovery case, action, audit, simulation, webhook, and recovery-job models.
- Verified `prisma/seed.ts` runs the deterministic `runDemoSeed` path.
- Safely classified the effective environment targets as local without exposing their values.

**Blockers:**

- The fresh Aiven URI is not present in the untracked local environment.
- The local `REDIS_URL` currently overrides the configured external Redis component variables.

**Next action:**

- After the user enters the rotated Aiven URI locally and removes or empties the local `REDIS_URL`, run `pnpm db:setup`, verify seeded PostgreSQL counts, start the worker long enough to create BullMQ queue/scheduler state, stop it cleanly, and verify Redis queue keys without exposing credentials.

### 2026-08-27 — External sample data loaded and verified

**Agent:** Codex

**Requested outcome:**

- Continue after fresh local provider configuration and populate PostgreSQL and Redis Cloud with the project sample state.

**Completed:**

- Confirmed the effective PostgreSQL target is external with `sslmode=require` and Redis resolves from external component credentials; `.env` remains ignored.
- Applied all four RecoveryOS migrations to Aiven.
- Fixed the Prisma `pg` runtime's CA-less Aiven TLS compatibility without disabling TLS globally or changing certificate-verified URLs.
- Increased only the deterministic seed's interactive transaction timeout from 5 to 30 seconds so the atomic remote seed can tolerate managed-network latency.
- Seeded Aurora Retail with deterministic seed `20260820`.
- Verified PostgreSQL counts: 1 merchant, 7 customers, 7 payments, 7 recovery cases, 13 recovery actions, 12 audit events, 1 recovery policy, and 1 simulation run; webhook and recovery-job counts were zero immediately after seeding.
- Initialized Redis Cloud with payment-event, analysis, action, verification, reconciliation, and system-health queue namespaces plus one reconciliation scheduler.
- Replaced colon-delimited custom BullMQ IDs with stable hyphen-delimited IDs after current BullMQ rejected colons.
- Removed only two failed reconciliation artifacts created during bootstrap and retained one delayed reconciliation job plus one scheduler.
- Re-ran the seed through the final seed-client-only timeout configuration and reproduced all seven cases.
- Verified exactly two matching exhausted reconciliation audit rows in Aiven, deleted only those bootstrap artifacts, and restored the clean zero-`RecoveryJob` baseline.
- Stopped the bootstrap worker and confirmed port 4001 is closed.
- Recorded D-040 through D-042.

**Files changed:**

- `packages/database/src/connection-config.ts` and `connection-config.test.ts`
- `packages/database/prisma/seed.ts`
- `packages/database/src/client.ts`, `prisma.ts`, and `seed/run-seed.ts`
- `packages/domain/src/queues.ts` and `queues.test.ts`
- `README.md`, `LIMITATIONS.md`, `DECISIONS.md`, `PROJECT_STRUCTURE.md`, and `STATUS.md`

**Validation:**

- Aiven migration status initially showed four pending migrations; `pnpm db:setup` applied all four.
- The first seed failed before writing rows because `pg` rejected Aiven's private certificate chain; the TLS compatibility fix passed focused tests.
- The second seed attempt reached Aiven but exceeded Prisma's 5-second transaction timeout and rolled back atomically.
- The bounded 30-second retry passed and reported seven seeded recovery cases.
- The final idempotent re-seed using constructor-level seed transaction options also passed with the same seed and case count.
- Direct read-only Aiven count verification passed with the expected related records.
- Database lint, typecheck, build, and 6 focused pool/TLS tests passed.
- Domain lint, typecheck, and all 7 domain tests passed.
- The transitive worker production build passed.
- The transitive API production build passed with the same database TLS configuration.
- Redis Cloud audit found 15 BullMQ keys across all six queue namespaces; bootstrap cleanup left zero failed jobs, one delayed reconciliation job, and one scheduler.
- Scoped PostgreSQL bootstrap cleanup removed exactly two exhausted reconciliation rows and left zero recovery jobs.
- Formatting and diff checks passed.

**Blockers:**

- Redis Cloud emitted `volatile-lru` warnings and did not expose `CONFIG GET`; change the Data eviction policy to `no eviction` in the provider console.
- Railway API/worker deployment and public readiness have not yet been verified with this code.

**Next action:**

- Change the Redis Cloud eviction policy, deploy both Railway services, and verify public liveness/readiness before configuring the Razorpay webhook.

### 2026-08-27 — Local frontend and API restored

**Agent:** Codex

**Requested outcome:**

- Fix the localhost connection refusal affecting the RecoveryOS frontend and recovery pages.

**Completed:**

- Confirmed the frontend was configured to call `http://localhost:4000` and that neither required local runtime was reliably reachable.
- Started the Fastify API with the existing external Aiven PostgreSQL and Redis Cloud configuration.
- Started the Next.js frontend on port 3000.
- Confirmed no Docker service was required for this external-provider configuration.
- Made no application-code or environment changes.

**Files changed:**

- `STATUS.md`

**Validation:**

- `GET http://localhost:4000/health/live` returned HTTP 200.
- `GET http://localhost:4000/health` returned HTTP 200 with PostgreSQL and Redis both `up`.
- `GET http://localhost:4000/recovery/cases?page=1&pageSize=1` returned HTTP 200.
- `GET http://localhost:3000/recoveries` returned HTTP 200.
- Ports 3000 and 4000 both have active Node.js listeners.

**Blockers:**

- Redis Cloud still needs the `no eviction` policy before production-like BullMQ deployment.
- The local worker is not running; start it separately when background recovery processing is required.

**Next action:**

- Continue local use at `http://localhost:3000`; start `pnpm dev:worker` only when testing queued recovery jobs, then resume Railway deployment verification when ready.

## Session entry template

```markdown
### YYYY-MM-DD — Short session title

**Agent:** Name

**Requested outcome:**

**Completed:**

**Files changed:**

**Validation:**

**Blockers:**

**Next action:**
```
