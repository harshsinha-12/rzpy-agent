# RecoveryOS

RecoveryOS is an AI-assisted revenue recovery layer for Razorpay merchants. It receives failed-payment events, diagnoses the likely cause, proposes an appropriate recovery strategy, applies deterministic policy guardrails, executes approved actions, and measures simulated incremental revenue recovered.

> Current state: Step 7 AI proposal and deterministic policy implementation is complete and awaiting approval. Step 5's live Test Mode acceptance check still needs dashboard keys and a public webhook URL.

## Core workflow

```text
Razorpay payment event
        ↓
Webhook verification and persistence
        ↓
Failure diagnosis
        ↓
AI action proposal
        ↓
Deterministic policy decision
        ↓
BullMQ execution or delayed job
        ↓
Outcome verification and audit trail
```

The LLM never directly executes a payment action.

## Planned stack

| Area       | Technology                                 | Purpose                                                   |
| ---------- | ------------------------------------------ | --------------------------------------------------------- |
| Frontend   | Next.js, TypeScript, Tailwind, CSS Modules | Dashboard, reported issues, case timelines                |
| API        | Node.js, TypeScript, Fastify               | Webhooks and product APIs                                 |
| Database   | PostgreSQL, Prisma                         | Durable cases, actions, policies, and audit events        |
| Jobs       | Redis, BullMQ                              | Background work, delayed recovery, retries, verification  |
| Payments   | Razorpay Test Mode                         | Orders, payment events, status checks, Payment Links      |
| AI         | OpenAI API                                 | Structured strategy proposal inside an allowed action set |
| Validation | Zod                                        | Runtime validation of configuration, APIs, and AI output  |

No external cron service or dedicated VM is required. BullMQ needs Redis and a continuously running worker process, which can run locally or as a small Railway/Render service. Periodic reconciliation can use a BullMQ repeatable job.

## Planned product surfaces

- `/` — executive recovery dashboard
- `/recoveries` — filterable Reported Issues table
- `/recoveries/[id]` — case reasoning and complete audit timeline

The UI will use seeded PostgreSQL data from the beginning. Razorpay Test Mode events will later enter the same tables and APIs. Every record will visibly identify its source as `SIMULATED` or `RAZORPAY_TEST_MODE`.

## Workspace layout

```text
apps/
  web/       Next.js application
  api/       Fastify HTTP API
  worker/    Long-running BullMQ worker and health server

packages/
  agents/    Structured recovery proposal agent and its read-only context boundary
  config/    Shared TypeScript configuration
  database/  Prisma schema, migrations, seed, and connection boundary
  domain/    Shared domain contracts
  razorpay/  Test-mode client, webhook verification, and payload mapping
  recovery-engine/  Pure deterministic diagnosis, policy validation, and fallback rules
```

The detailed structure contract is in `PROJECT_STRUCTURE.md`.

## Local setup

Prerequisites:

- Node.js `22.18.0`
- pnpm `10.33.0`
- Docker Desktop

Install dependencies and prepare the local environment:

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm infra:up
pnpm db:setup
pnpm dev
```

`pnpm db:setup` generates the Prisma client, applies migrations, and loads the deterministic demo seed. Re-running `pnpm db:seed` replaces the Aurora Retail demo merchant with the same records for the configured `DEMO_SEED`.

Local endpoints:

| Service                | URL                                   |
| ---------------------- | ------------------------------------- |
| Web                    | `http://localhost:3000`               |
| Web Test Mode checkout | `http://localhost:3000/demo/checkout` |
| API health             | `http://localhost:4000/health`        |
| Worker health          | `http://localhost:4001/health`        |
| PostgreSQL             | `localhost:5432`                      |
| Redis                  | `localhost:6380`                      |

Read-only product endpoints:

| Endpoint                  | Purpose                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `GET /recovery/cases`     | Paginated Reported Issues data with search, filters, and sorting        |
| `GET /recovery/cases/:id` | Normalized payment, recovery actions, customer context, and audit trail |
| `GET /analytics/overview` | Reconciled KPIs, funnel, breakdowns, strategy results, and simulation   |

Razorpay Test Mode endpoints:

| Endpoint                      | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `POST /webhooks/razorpay`     | Signed webhook ingest, raw payload persistence, and job enqueue |
| `GET /demo/razorpay/checkout` | Whether Test Mode keys are configured                           |
| `POST /demo/razorpay/orders`  | Create a Test Mode order for the demo checkout                  |

The case list accepts `page`, `pageSize`, `search`, `status`, `failureCategory`, `paymentMethod`, `dataSource`, `errorSource`, `sortBy`, and `sortOrder`. Sorting supports `amountAtRiskPaise` and `lastUpdatedAt`. Money remains in integer paise, each response carries data-source labels, and invalid requests use a consistent error envelope.

The deterministic diagnosis engine classifies normalized Razorpay signals before any LLM is involved. It records the matched evidence, recoverability score and band, whether customer contact is safe, and a bounded pre-policy fallback action. Merchant integration failures always escalate without customer contact; unknown first attempts wait, while repeated unknown failures escalate.

The recovery agent uses the OpenAI Responses API with `gpt-5.6-terra` by default and validates every proposal against a strict Zod schema. It receives a read-only case context and has no Razorpay, database-write, messaging, or execution tools. Each new proposal is independently checked by deterministic policy code for payment state, action and message limits, cooldown, recovery window, consent, merchant failures, and duplicate work. Model failures or invalid output fall back to the Step 6 deterministic recommendation before policy validation.

The API call is bounded to one proposal per newly ingested case, low reasoning effort, 700 maximum output tokens, a 12-second timeout, one SDK retry, and `store: false`. Set `OPENAI_MODEL` to override the default without changing code.

To send a real Test Mode failure into Reported Issues:

1. Create Test Mode API keys at [Razorpay API Keys](https://dashboard.razorpay.com/app/websiteapp-settings/api-keys).
2. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the untracked `.env` file. Never commit them.
3. Create a webhook at [Razorpay Webhooks](https://dashboard.razorpay.com/app/webhooks) for `payment.failed`, `payment.authorized`, and `payment.captured`. Point it at a public HTTPS URL for `POST /webhooks/razorpay` and store the webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Restart the API and worker, open `/demo/checkout`, and pay with UPI ID `failure@razorpay`.
5. Filter Reported Issues by `RAZORPAY_TEST_MODE`.

Redis uses host port `6380` because port `6379` may already be occupied by a machine-level Redis service. Inside Docker, the project Redis service still uses its standard port `6379`.

Stop the project containers without deleting their persistent volumes:

```bash
pnpm infra:down
```

## Validation commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:setup
```

`pnpm install` also prepares Husky. The pre-commit hook uses lint-staged to run ESLint and Prettier only against staged files. The production web build intentionally uses Next.js Webpack mode because Turbopack's CSS helper requires a temporary local port that is unavailable in some sandboxed build environments.

The root test command runs workspace suites serially, and API test files disable parallel execution, because the API, worker, and database integration tests intentionally share and reseed the same local demo database.

## Repository documents

- `idea.md` — full product concept
- `PLAN.md` — strict implementation sequence
- `STATUS.md` — current progress and session-by-session log
- `DECISIONS.md` — decision ledger
- `PROJECT_STRUCTURE.md` — required folder, file, and dependency conventions
- `AGENTS.md` — instructions for every implementation agent
- `.env.example` — configuration contract without secrets

## Credentials eventually required

- Razorpay Test Mode Key ID and Key Secret
- Razorpay webhook secret
- OpenAI API key
- PostgreSQL connection URL
- Redis connection URL

Never place credential values in chat or commit them to Git. Copy `.env.example` to an untracked `.env` file when implementation begins.

## How implementation will proceed

Implementation must follow `PLAN.md` in order. Only one step may be active at a time, and each step has an explicit acceptance gate. `STATUS.md` identifies the current step and the exact next action.
