# RecoveryOS

RecoveryOS is an AI-assisted revenue recovery layer for Razorpay merchants. It receives failed-payment events, diagnoses the likely cause, proposes an appropriate recovery strategy, applies deterministic policy guardrails, executes approved actions, and measures simulated incremental revenue recovered.

> Current state: Step 1 workspace foundation implemented and awaiting approval before Step 2 database work.

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

| Area       | Technology                              | Purpose                                                   |
| ---------- | --------------------------------------- | --------------------------------------------------------- |
| Frontend   | Next.js, TypeScript, Tailwind, Recharts | Dashboard, reported issues, case timelines                |
| API        | Node.js, TypeScript, Fastify            | Webhooks and product APIs                                 |
| Database   | PostgreSQL, Prisma                      | Durable cases, actions, policies, and audit events        |
| Jobs       | Redis, BullMQ                           | Background work, delayed recovery, retries, verification  |
| Payments   | Razorpay Test Mode                      | Orders, payment events, status checks, Payment Links      |
| AI         | OpenAI API                              | Structured strategy proposal inside an allowed action set |
| Validation | Zod                                     | Runtime validation of configuration, APIs, and AI output  |

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
  config/    Shared TypeScript configuration
  database/  PostgreSQL connection boundary
  domain/    Shared domain contracts
  razorpay/  Test-mode configuration boundary; API behavior begins in Step 5
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
pnpm dev
```

Local endpoints:

| Service       | URL                            |
| ------------- | ------------------------------ |
| Web           | `http://localhost:3000`        |
| API health    | `http://localhost:4000/health` |
| Worker health | `http://localhost:4001/health` |
| PostgreSQL    | `localhost:5432`               |
| Redis         | `localhost:6380`               |

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
```

`pnpm install` also prepares Husky. The pre-commit hook uses lint-staged to run ESLint and Prettier only against staged files. The production web build intentionally uses Next.js Webpack mode because Turbopack's CSS helper requires a temporary local port that is unavailable in some sandboxed build environments.

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
