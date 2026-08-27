# Known limitations

This document records demo and product limits that are intentional or not yet in scope. They are not hidden defects.

## Current demo

- Live Razorpay webhook delivery still needs a webhook secret and a public HTTPS URL. Local ingestion and signed-fixture tests already cover the product path.
- Reminders and alternative-method outreach are recorded as `SIMULATED`. They never send SMS, email, or WhatsApp.
- Payment Links are silent Test Mode links. Customer notifications from Razorpay stay disabled.
- Simulated recovered amounts are labelled `SIMULATED` and must not be presented as real merchant revenue.
- The first version recovers failed one-time payments only. Subscriptions, voice recovery, merchant chat, and multi-merchant authentication are out of scope.
- The RecoveryOS simulator uses a deterministic, policy-controlled strategy over visible payment facts; it does not make 250–500 live OpenAI calls. Hidden probabilities remain evaluator-only so runs stay reproducible and do not leak outcome knowledge into strategy decisions.

## Reliability and security

- API rate limits are in-process. Multiple API replicas do not share a counter.
- Log redaction covers secrets, signatures, and payment identifiers in structured logs. Raw webhook payloads remain in PostgreSQL for audit and are not returned by the merchant-facing API.
- A Razorpay 5xx during Payment Link creation retries with the same action-bound reference. If Razorpay created a link and then timed out, the next attempt looks up that reference instead of creating a second link.
- OpenAI failures fall back to the diagnosis engine's deterministic action. The model never executes a payment or message.
- Worker jobs survive process restarts because BullMQ stores them in Redis. PostgreSQL remains the durable source of truth for cases, actions, and audit events.
- The Next.js frontend deploys to Vercel, while the Fastify API and BullMQ worker run on Railway. Redis is externally managed by Redis Cloud, and the managed PostgreSQL provider is still pending. Vercel cannot host the persistent API or worker processes.

## Credentials and operations

- Razorpay Test Mode keys, the webhook secret, and the OpenAI key belong only in an untracked local environment file.
- Exhausted recovery jobs stop and escalate. They do not retry forever.
- Already-captured payments are re-checked immediately before execution and cannot receive another recovery action.
