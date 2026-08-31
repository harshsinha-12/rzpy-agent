# Agent Working Agreement

This file is the operating contract for every coding agent working in this repository.

## Required reading order

Before making any change, read these files in order:

1. `AGENTS.md`
2. `README.md`
3. `PLAN.md`
4. `STATUS.md`
5. `DECISIONS.md`
6. `PROJECT_STRUCTURE.md`
7. The relevant sections of `idea.md`

## Step-gated implementation

- `PLAN.md` is the source of truth for implementation order.
- Work only on the step marked **In progress** in `STATUS.md`.
- Do not start a later step merely because it is convenient.
- A step is complete only when all of its acceptance checks pass.
- Record verification commands and their results in `STATUS.md`.
- Wait for explicit user approval before advancing to the next implementation step.
- If new work is requested, place it into the appropriate plan step before implementing it.

## Session protocol

At the start of every session:

1. Read the required files above.
2. Confirm the current step and its remaining checklist.
3. Inspect the actual repository state; do not rely only on the status log.
4. State the narrow outcome intended for the session.

At the end of every session:

1. Update the current snapshot in `STATUS.md`.
2. Append one entry to the session log in `STATUS.md`.
3. Record files changed, validation performed, blockers, and the exact next action.
4. Update `DECISIONS.md` if a product or architecture decision was made.
5. Do not mark work complete without evidence.

## Engineering rules

- Use TypeScript across the web app, API, workers, and shared packages.
- Keep the LLM advisory: it proposes a structured action, but deterministic policy code approves or denies execution.
- Never let the LLM directly execute payment or messaging actions.
- Treat PostgreSQL as the durable source of truth and Redis/BullMQ as asynchronous job infrastructure.
- Verify Razorpay webhook signatures and process webhook events idempotently.
- Acknowledge webhooks quickly, then perform analysis and recovery in background jobs.
- Do not hardcode dashboard data in React components. Seed it into PostgreSQL and access it through the API.
- Label every case and metric with `SIMULATED` or `RAZORPAY_TEST_MODE`.
- Never present simulated recovery as real merchant revenue.
- Preserve raw Razorpay webhook payloads for auditability while exposing normalized fields to the product.
- Store money in integer currency subunits, such as paise, never floating-point rupee values.
- Keep secrets out of source control, logs, screenshots, fixtures, and documentation.
- Prefer small, reversible changes and focused tests.
- Follow `PROJECT_STRUCTURE.md`; create modules when their responsibility exists instead of accumulating large multipurpose files.
- Keep each AI agent's orchestration in `agent.ts` and its tool definitions or adapters in `tools.ts`.
- Keep feature-specific fetchers, schemas, types, configuration, constants, and utilities in clearly named separate files when needed.

## Scope guardrails

The first version includes failed-payment recovery only. Checkout drop-off, failed subscriptions, B2B receivables, mandate sequencing, generated voice recovery, promise-to-pay / udhaar tracking, real SMS/WhatsApp delivery, multi-merchant authentication, and adaptive model training stay out of implementation until the core demo is complete. Those Track 03 expansions are sequenced as `PLAN.md` Steps 17–22. Step 23 is the public product landing after those expansions. None of Steps 17–23 may start while an earlier step is in progress.

The must-have user experience is:

1. Executive dashboard
2. Reported Issues table
3. Recovery case detail and audit timeline
4. Razorpay Test Mode event appearing in the product
5. Baseline-versus-agent simulation

After Step 23, `/` is the public landing explainer and the executive dashboard lives at `/dashboard`.

## Documentation ownership

- `idea.md`: product vision and detailed concept
- `PLAN.md`: ordered implementation contract and acceptance gates
- `STATUS.md`: current state and append-only session history
- `DECISIONS.md`: durable product and architecture decisions
- `PROJECT_STRUCTURE.md`: folder, file, dependency, and modularity rules
- `README.md`: project entry point and human setup guide
