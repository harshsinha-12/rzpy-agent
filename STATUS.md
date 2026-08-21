# Project Status

Last updated: 2026-08-21

## Current snapshot

- **Current step:** Step 12 — Deployment and hackathon demo package
- **State:** Steps 10 and 11 are complete after user approval; Step 12 is in progress with the public project explanation and architecture package
- **Application code:** The frontend now includes a plain-language About page and an accessible runtime architecture diagram covering Razorpay Test Mode, GPT-5.6 Terra, deterministic policy, Fastify, PostgreSQL, Redis/BullMQ, the five worker queues, 60-second reconciliation, and the simulator. Matching Mermaid diagrams live in `ARCHITECTURE.md`.
- **Runtime services:** The web, API, worker, Docker PostgreSQL, and Docker Redis services were observed running locally during this session
- **Current blocker:** A signed live webhook still needs a separate webhook secret and public HTTPS URL; API-only verification is configured and authenticated
- **Exact next action:** Review the About and architecture surfaces, then continue the remaining Step 12 deployment and demo-package work

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

| Credential                      | Needed in step | Status                         |
| ------------------------------- | -------------: | ------------------------------ |
| Local PostgreSQL URL            |              1 | Configured with Docker default |
| Local Redis URL                 |              1 | Configured on host port 6380   |
| Razorpay Test Key ID and Secret |              5 | Configured and authenticated   |
| Razorpay webhook secret         |              5 | Not created                    |
| OpenAI API key                  |              7 | Configured locally             |
| Deployment credentials          |             12 | Not needed yet                 |

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
