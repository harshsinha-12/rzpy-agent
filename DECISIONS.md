# Decision Ledger

This file records durable product and architecture decisions. Add a new row when a decision changes; do not silently rewrite history.

| ID | Date | Decision | Rationale | Status |
| --- | --- | --- | --- | --- |
| D-001 | 2026-08-20 | Build failed-payment recovery before subscription recovery. | A narrow, complete recovery loop is stronger than several partial workflows. | Accepted |
| D-002 | 2026-08-20 | Use TypeScript across Next.js, Fastify, workers, and shared packages. | One language reduces hackathon integration and maintenance cost. | Accepted |
| D-003 | 2026-08-20 | Use PostgreSQL with Prisma as the durable source of truth. | Recovery cases, actions, policies, and audits need relational integrity and traceability. | Accepted |
| D-004 | 2026-08-20 | Use Redis and BullMQ for asynchronous, delayed, and retried work. | Recovery actions are event-relative jobs and need persistence, backoff, and idempotency. | Accepted |
| D-005 | 2026-08-20 | Do not require a dedicated VM or external cron service. | A persistent worker can run on a managed service; BullMQ can also schedule repeatable reconciliation. | Accepted |
| D-006 | 2026-08-20 | The LLM proposes actions but cannot execute money or messaging actions directly. | Deterministic policy and tools must retain control over financial side effects. | Accepted |
| D-007 | 2026-08-20 | Seed realistic dummy records into PostgreSQL rather than hardcoding frontend arrays. | The API, UI, analytics, and later Test Mode events should exercise one real data path. | Accepted |
| D-008 | 2026-08-20 | Label data as `SIMULATED` or `RAZORPAY_TEST_MODE`. | Test and simulated outcomes must never be presented as real merchant revenue. | Accepted |
| D-009 | 2026-08-20 | Include a filterable Reported Issues table as a primary frontend surface. | Merchants need to move from aggregate recovery metrics to individual actionable cases. | Accepted |
| D-010 | 2026-08-20 | Follow `PLAN.md` sequentially with explicit approval between steps. | This keeps implementation reviewable and prevents unplanned scope from displacing the core flow. | Accepted |
| D-011 | 2026-08-20 | Use feature-first modules with explicit transport, service, persistence, integration, and presentation boundaries. | Small, responsibility-focused files are easier to test, review, and maintain. | Accepted |
| D-012 | 2026-08-20 | Give every AI agent separate `agent.ts` and `tools.ts` files, plus separate prompt and schema files when used. | Agent orchestration, available capabilities, instructions, and validation need independent review. | Accepted |
| D-013 | 2026-08-20 | Create utilities, fetchers, configuration, globals, and shared modules only when a real responsibility exists. | This preserves modularity without creating empty abstraction layers or generic dumping grounds. | Accepted |

## Open decisions

These decisions are intentionally deferred until their plan step approaches:

| Needed by | Decision |
| ---: | --- |
| Step 4 | Final demo merchant name, logo, and visual direction |
| Step 5 | Razorpay Test Mode account and webhook exposure method |
| Step 7 | OpenAI model selection and cost ceiling |
| Step 9 | Whether reminders remain simulated for the entire demo |
| Step 12 | Vercel plus Railway/Render, or another deployment combination |
