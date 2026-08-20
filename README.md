# RecoveryOS

RecoveryOS is an AI-assisted revenue recovery layer for Razorpay merchants. It receives failed-payment events, diagnoses the likely cause, proposes an appropriate recovery strategy, applies deterministic policy guardrails, executes approved actions, and measures simulated incremental revenue recovered.

> Current state: planning and repository setup. No application code has been implemented yet.

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

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js, TypeScript, Tailwind, Recharts | Dashboard, reported issues, case timelines |
| API | Node.js, TypeScript, Fastify | Webhooks and product APIs |
| Database | PostgreSQL, Prisma | Durable cases, actions, policies, and audit events |
| Jobs | Redis, BullMQ | Background work, delayed recovery, retries, verification |
| Payments | Razorpay Test Mode | Orders, payment events, status checks, Payment Links |
| AI | OpenAI API | Structured strategy proposal inside an allowed action set |
| Validation | Zod | Runtime validation of configuration, APIs, and AI output |

No external cron service or dedicated VM is required. BullMQ needs Redis and a continuously running worker process, which can run locally or as a small Railway/Render service. Periodic reconciliation can use a BullMQ repeatable job.

## Planned product surfaces

- `/` — executive recovery dashboard
- `/recoveries` — filterable Reported Issues table
- `/recoveries/[id]` — case reasoning and complete audit timeline

The UI will use seeded PostgreSQL data from the beginning. Razorpay Test Mode events will later enter the same tables and APIs. Every record will visibly identify its source as `SIMULATED` or `RAZORPAY_TEST_MODE`.

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
# rzpy-agent
