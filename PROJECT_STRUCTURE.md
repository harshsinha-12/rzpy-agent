# Project Structure and Modularity Standard

This document defines how RecoveryOS code must be organized. It is a maintainability contract, not a requirement to create every folder immediately. Create a file or directory when its responsibility first exists; do not add empty architecture placeholders.

## Structural principles

1. Organize product code by feature, then separate layers inside the feature.
2. Give each file one primary responsibility and a precise name.
3. Keep transport, business rules, persistence, external integrations, and presentation separate.
4. Keep deterministic recovery logic independent from AI orchestration.
5. Prefer feature-local helpers over a generic shared dumping ground.
6. Move code into a shared package only when at least two real consumers need the same contract or behavior.
7. Avoid import-time side effects. Create clients and dependencies through explicit factories where practical.
8. Keep tests close to the behavior they verify, using `*.test.ts` or `*.test.tsx`.
9. Review files that grow beyond roughly 250–300 lines and split them when they contain multiple responsibilities.
10. Do not create circular dependencies or let lower layers import from delivery layers.

## Target monorepo shape

The tree below is the intended direction. Individual entries are created only in the plan step where they become useful.

```text
.
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── about/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── recoveries/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   └── ui/
│   │   │   ├── features/
│   │   │   │   ├── about/
│   │   │   │   │   ├── components/
│   │   │   │   │   └── content.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── fetchers.ts
│   │   │   │   │   ├── schemas.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   └── utils.ts
│   │   │   │   └── recoveries/
│   │   │   │       ├── components/
│   │   │   │       ├── fetchers.ts
│   │   │   │       ├── schemas.ts
│   │   │   │       ├── types.ts
│   │   │   │       └── utils.ts
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── lib/
│   │   │   │   └── api-client.ts
│   │   │   └── types/
│   │   │       └── global.d.ts
│   │   └── tests/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── plugins/
│   │   │   ├── modules/
│   │   │   │   ├── health/
│   │   │   │   ├── recoveries/
│   │   │   │   │   ├── routes.ts
│   │   │   │   │   ├── controller.ts
│   │   │   │   │   ├── service.ts
│   │   │   │   │   ├── repository.ts
│   │   │   │   │   ├── schemas.ts
│   │   │   │   │   ├── mappers.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── simulator/
│   │   │   │   │   ├── routes.ts
│   │   │   │   │   ├── controller.ts
│   │   │   │   │   ├── service.ts
│   │   │   │   │   ├── repository.ts
│   │   │   │   │   ├── schemas.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── webhooks/
│   │   │   │       └── razorpay/
│   │   │   └── lib/
│   │   │       ├── errors.ts
│   │   │       └── logger.ts
│   │   └── tests/
│   └── worker/
│       ├── src/
│       │   ├── worker.ts
│       │   ├── config/
│       │   │   └── env.ts
│       │   ├── queues/
│       │   │   ├── names.ts
│       │   │   └── connection.ts
│       │   └── jobs/
│       │       ├── process-payment-event.ts
│       │       ├── analyse-recovery.ts
│       │       ├── execute-recovery.ts
│       │       └── verify-recovery.ts
│       └── tests/
├── packages/
│   ├── agents/
│   │   └── src/
│   │       └── recovery/
│   │           ├── agent.ts
│   │           ├── tools.ts
│   │           ├── prompt.ts
│   │           ├── schemas.ts
│   │           └── types.ts
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       └── client.ts
│   ├── domain/
│   │   └── src/
│   │       ├── recovery/
│   │       ├── payments/
│   │       └── constants.ts
│   ├── recovery-engine/
│   │   └── src/
│   │       ├── diagnosis/
│   │       ├── policy/
│   │       ├── execution/
│   │       └── idempotency/
│   ├── simulator/
│   │   └── src/
│   │       ├── generator.ts
│   │       ├── outcome-model.ts
│   │       ├── strategies.ts
│   │       └── evaluate.ts
│   ├── razorpay/
│   │   └── src/
│   │       ├── client.ts
│   │       ├── payments.ts
│   │       ├── payment-links.ts
│   │       ├── webhooks.ts
│   │       └── schemas.ts
│   ├── test-utils/
│   └── config/
├── AGENTS.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── PLAN.md
├── PROJECT_STRUCTURE.md
├── README.md
└── STATUS.md
```

## Backend module responsibilities

Backend features follow a clear dependency direction:

```text
route → controller → service → repository or integration adapter
```

- `routes.ts` registers HTTP paths, authentication hooks, and request/response schemas.
- `controller.ts` translates HTTP input into a service call and maps the result to HTTP output.
- `service.ts` coordinates the use case and applies application-level behavior.
- `repository.ts` owns database queries for that feature.
- `schemas.ts` contains Zod schemas for runtime boundaries.
- `mappers.ts` converts database/provider representations into domain or API representations.
- `types.ts` contains feature-local TypeScript types that are not already inferred from Zod.

Controllers must not contain business rules or Prisma queries. Repositories must not know about Fastify request or response objects.

## Frontend feature responsibilities

- Route files compose pages and handle route-level loading or metadata.
- Feature components render one product capability such as the recovery table or audit timeline.
- `fetchers.ts` contains typed API calls for that feature and no React rendering logic.
- `schemas.ts` validates data received at runtime.
- `types.ts` holds frontend-specific view types when they cannot be derived from schemas or shared contracts.
- `utils.ts` contains pure, feature-specific formatting or transformation helpers.
- Reusable visual primitives live in `components/ui`; domain-aware components stay in their feature directory.

Do not put API requests directly inside presentation components. Do not hardcode seeded cases in page or component files.

## Agent file contract

Every AI agent must live in its own directory and keep at least these files separate:

```text
agent-name/
├── agent.ts
├── tools.ts
├── prompt.ts
├── schemas.ts
└── types.ts
```

- `agent.ts` owns orchestration: preparing context, calling the model, validating its response, and returning a proposal.
- `tools.ts` defines the agent's narrow, typed tool adapters. Tools must call services or interfaces rather than importing HTTP controllers.
- `prompt.ts` owns system instructions and prompt construction.
- `schemas.ts` owns structured input/output and tool-call validation.
- `types.ts` contains types not derived from the schemas.

For the recovery agent specifically, `agent.ts` may return an action proposal but must not execute Razorpay or messaging side effects. Execution belongs to the deterministic recovery engine after policy approval.

If another agent is introduced later, it receives a separate sibling directory with its own `agent.ts` and `tools.ts`; unrelated agent logic must not be combined into one large file.

## Utilities

Create `utils.ts` only when there is actual reusable, pure behavior.

- Prefer `features/recoveries/utils.ts` for recovery UI transformations.
- Prefer a named domain module such as `money.ts`, `dates.ts`, or `idempotency-key.ts` when the behavior has a clear concept.
- Use a shared utility only after multiple packages genuinely need it.
- Utilities must not hide database access, network calls, mutable global state, or product policy.
- Avoid a large root-level `utils.ts` containing unrelated helpers.

## Configuration

- Only an app's `config/env.ts` may read `process.env` directly.
- Validate environment variables once with Zod and export a typed immutable configuration object.
- Keep runtime configuration separate from constants and business policy.
- Shared build configuration belongs in `packages/config`.
- Merchant recovery policy belongs in the database/domain layer, not environment variables.
- Secrets must never be exposed through `NEXT_PUBLIC_*` variables.

## Globals and constants

- Global CSS belongs in `apps/web/src/app/globals.css`.
- Global TypeScript augmentation belongs in `types/global.d.ts` and should be rare.
- Cross-domain constants belong in a named file such as `packages/domain/src/constants.ts`.
- Feature constants stay inside their feature.
- Do not create a mutable `globals.ts` object or use global variables for clients, requests, cases, or job state.

## Fetchers and external clients

- Frontend request functions belong in feature-level `fetchers.ts` files and share one configured `api-client.ts`.
- Provider-specific Razorpay HTTP behavior belongs in `packages/razorpay`.
- Fetchers must return typed results, handle non-success responses consistently, and accept cancellation signals where useful.
- React components must not know Razorpay credentials or provider request shapes.
- Backend services depend on provider interfaces so tests can use deterministic fakes.

## Public exports and imports

- Prefer direct imports inside an app or package.
- Use a package-level `index.ts` only as an intentional public API, not as a barrel for every internal file.
- Do not import private source paths across package boundaries.
- Dependency direction is from apps toward packages; shared packages must not import app code.
- The deterministic domain and recovery engine must not import UI, Fastify, BullMQ, Prisma, or OpenAI-specific delivery code unless placed behind an adapter.

## Definition of maintainable for this project

A change is maintainable when:

- its responsibility is obvious from its file path and name;
- business rules can be tested without starting the web server;
- provider APIs and AI responses can be replaced with fakes in tests;
- a frontend component can render from typed data without knowing persistence details;
- changing one recovery strategy does not require editing unrelated dashboard, webhook, or queue files;
- an agent's prompt, tools, schemas, and orchestration can be reviewed independently;
- validation passes and the session log names the files and behavior changed.
