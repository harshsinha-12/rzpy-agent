# RecoveryOS Architecture

RecoveryOS is an explainable recovery layer on top of Razorpay. It turns a failed payment into a durable case, diagnoses the likely cause, asks AI for one bounded recommendation, checks that recommendation against deterministic policy, schedules any approved work, and follows the payment until it is recovered, escalated, or stopped.

The model is advisory. It cannot call Razorpay, write to PostgreSQL, enqueue work, or contact a customer.

## System architecture

```mermaid
flowchart TB
  Merchant[Merchant or demo user]
  Web[Next.js frontend<br/>Dashboard, Reported Issues, case detail, Test checkout]
  Razorpay[Razorpay Test Mode<br/>Orders, payments, webhooks, Payment Links]
  API[Fastify API<br/>Validation, product APIs, webhook ingestion, simulator]
  Postgres[(PostgreSQL + Prisma<br/>Durable source of truth)]
  Redis[(Redis + BullMQ<br/>Delayed and retried job state)]
  Worker[Long-running recovery worker<br/>Five queue consumers]
  Diagnosis[Deterministic diagnosis engine<br/>Failure facts and safe fallback]
  Agent[Recovery agent<br/>Read-only case context]
  OpenAI[OpenAI Responses API<br/>GPT-5.6 Terra]
  Policy[Deterministic policy engine<br/>Consent, limits, cooldown, payment state]
  Tools[Recovery execution tools<br/>Status re-check and silent Test Mode Payment Link]
  Verify[Outcome verification<br/>Provider state and audit events]
  Simulator[Deterministic simulator<br/>250-500 synthetic failures and three strategies]

  Merchant --> Web
  Web -->|HTTPS product requests| API
  Web -->|Test checkout| Razorpay
  Razorpay -->|Signed payment webhooks| API
  API -->|Persist event and normalized records| Postgres
  API -->|Enqueue payment event| Redis
  Redis --> Worker
  Worker --> Postgres
  Worker --> Diagnosis
  Diagnosis --> Agent
  Agent -->|Structured prompt| OpenAI
  OpenAI -->|Validated proposal only| Agent
  Agent --> Policy
  Policy -->|Approved action| Tools
  Policy -->|Denied or safe fallback| Postgres
  Tools --> Razorpay
  Tools --> Verify
  Razorpay -->|Payment or Payment Link state| Verify
  Verify --> Postgres
  Postgres --> API
  Simulator --> API
  API -->|Persist run and individual outcomes| Postgres

  classDef primary fill:#e7ebff,stroke:#173055,color:#11264a;
  classDef provider fill:#fff0cc,stroke:#f5be4b,color:#11264a;
  classDef state fill:#11264a,stroke:#3158ff,color:#fbf8ef;
  classDef guard fill:#e5f2eb,stroke:#17664e,color:#11264a;
  class Web,API,Worker,Agent,Simulator primary;
  class Razorpay,OpenAI provider;
  class Postgres,Redis state;
  class Diagnosis,Policy,Tools,Verify guard;
```

## Queue and scheduling architecture

Recovery work runs outside the API request so a webhook can be acknowledged quickly and delayed actions survive API restarts.

```mermaid
flowchart LR
  Event[payment-events queue]
  Analysis[recovery-analysis queue]
  Action[recovery-actions queue]
  Verification[recovery-verification queue]
  Reconciliation[recovery-reconciliation queue]
  Scheduler[BullMQ repeatable scheduler<br/>every 60 seconds]
  Worker[Recovery worker]
  Database[(PostgreSQL)]

  Event -->|Normalize and create case| Analysis
  Analysis -->|Diagnose, propose, and apply policy| Action
  Action -->|Execute approved work| Verification
  Verification -->|Recovered, re-analyse, escalate, or stop| Database
  Scheduler --> Reconciliation
  Reconciliation -->|Find stale webhooks| Event
  Reconciliation -->|Find cases without analysis| Analysis
  Reconciliation -->|Find overdue approved actions| Action
  Event --> Worker
  Analysis --> Worker
  Action --> Worker
  Verification --> Worker
  Reconciliation --> Worker
  Worker --> Database

  classDef queue fill:#e7ebff,stroke:#3158ff,color:#11264a;
  classDef runtime fill:#11264a,stroke:#f5be4b,color:#fbf8ef;
  class Event,Analysis,Action,Verification,Reconciliation queue;
  class Scheduler,Worker,Database runtime;
```

This is the project's cron-like behavior. There is no external cron service or dedicated VM. BullMQ stores the repeatable schedule in Redis and triggers reconciliation every 60 seconds while the continuously running worker is online.

## Hosting split

| Runtime         | Platform | Role                                               |
| --------------- | -------- | -------------------------------------------------- |
| Next.js web     | Vercel   | Dashboard, Reported Issues, checkout, and About    |
| Fastify API     | Railway  | Product APIs and Razorpay webhook ingestion        |
| Recovery worker | Railway  | Five BullMQ consumers and 60-second reconciliation |
| PostgreSQL      | Railway  | Durable source of truth                            |
| Redis           | Railway  | Queue, retry, and scheduler state                  |

Vercel cannot run the API or worker. Those processes must stay online so delayed jobs and webhook acknowledgements survive.

## Integrated components

| Component                     | Responsibility                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Next.js and React             | Merchant dashboard, Reported Issues, recovery detail, architecture explanation, and Test Mode checkout        |
| Fastify                       | Product APIs, analytics, simulator endpoint, secure headers, rate limits, and Razorpay webhook ingestion      |
| Razorpay Test Mode            | Checkout orders, failed-payment events, payment state checks, and silent Payment Links without live money     |
| OpenAI Responses API          | A structured `gpt-5.6-terra` recovery proposal from read-only case facts                                      |
| Deterministic recovery engine | Failure diagnosis, fallback action, and policy authority over every proposal                                  |
| PostgreSQL and Prisma         | Cases, customers, payments, actions, policies, webhook events, jobs, audits, simulation runs, and outcomes    |
| Redis and BullMQ              | Persistent queues, delayed work, bounded retries, stable job IDs, verification, and repeatable reconciliation |
| Recovery worker               | Consumes all five queues and connects diagnosis, AI, policy, tools, and verification                          |
| Simulator                     | Reproducible comparison of no intervention, naive retry, and RecoveryOS using labelled synthetic money        |

## Safety and reliability boundaries

- Razorpay webhook signatures are verified before events are accepted.
- Provider events, actions, and jobs use stable IDs and database constraints to prevent duplicate work.
- Payment state is re-checked immediately before an approved side effect.
- Razorpay 5xx responses are retried with the same action-bound reference, preventing duplicate Payment Links.
- AI output is Zod-validated and falls back to deterministic advice when unavailable or malformed.
- Policy can deny any AI proposal regardless of model confidence.
- Logs redact secrets, signatures, and payment identifiers.
- Every record and amount is labelled `SIMULATED` or `RAZORPAY_TEST_MODE`; neither represents live merchant revenue.
