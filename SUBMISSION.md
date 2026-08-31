# RecoveryOS submission runbook

This is the repeatable Step 16 handoff for a Razorpay AI Revenue Recovery judge demo. It intentionally separates the two kinds of evidence:

| Evidence                      | What it proves                                                                                         | Label to use         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| Paid ₹1 Payment Link          | A signed failed payment became a policy-gated, auditable, paid recovery outcome in Razorpay Test Mode. | `RAZORPAY_TEST_MODE` |
| Frozen 500-payment comparator | RecoveryOS outperforms no intervention and naive retry over identical stored synthetic outcomes.       | `SIMULATED`          |

Do not call either real merchant revenue.

## Known-good evidence

| Item                                       | Verified value                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen configuration                       | 500 payments · seed `20260821` · hash `925ba5d2`                                                                                                     |
| Stored outcomes                            | 1,500                                                                                                                                                |
| Revenue at risk                            | ₹28,75,582 `SIMULATED`                                                                                                                               |
| No intervention / naive retry / RecoveryOS | ₹3,33,131 / ₹5,50,591 / ₹13,34,223 `SIMULATED`                                                                                                       |
| Incremental recovery                       | +₹7,83,632 `SIMULATED`                                                                                                                               |
| Guardrails visible in the evidence         | 164 stops · 63 escalations · 8 prevented unnecessary interventions                                                                                   |
| Live-loop proof                            | One ₹1 `RAZORPAY_TEST_MODE` Payment Link paid through the Netbanking mock-bank `Success` control; case `RECOVERED` with `payment_link.paid.received` |

## Demo order

Follow [DEMO_SCRIPT.md](./DEMO_SCRIPT.md): start on the frozen comparison, inspect the paid Test Mode case and its audit trail, show the controlled 5xx test proof, and end on incremental simulated recovery. Keep the provider dashboard out of the recording except for the Test Mode mock-bank page if a fresh live-loop demonstration is needed.

## Reset and fallback

1. Do **not** reseed or reset the hosted database before a judge demo. It would erase the paid Test Mode proof and frozen run. Railway’s normal pre-deploy command is `pnpm db:migrate`.
2. Use the existing recovered Test Mode case and the persisted frozen run for the primary walkthrough. A fresh checkout is optional, not a prerequisite.
3. If a fresh Test Mode proof is required, generate an initial failure in `/demo/checkout`, wait for its case and approved action, open the Payment Link, choose Netbanking, then select `Success` on Razorpay’s mock bank page. Never use real payment credentials or claim real revenue.
4. For a local-only clean slate, run `pnpm infra:up && pnpm db:setup`. This replaces the local demo data only. In production, seeding is fail-closed unless a one-time `ALLOW_DEMO_RESET=RESET_AURORA_RETAIL` is deliberately supplied; do not persist that variable.
5. If Razorpay checkout is unavailable, use the existing paid case and run the graceful-failure test below. If the hosted web is unavailable, use the `/about` page and captured backup screenshots; do not invent a new payment outcome.

## Graceful 5xx proof

Run this locally against the isolated test database:

```bash
pnpm --filter @recoveryos/worker exec vitest run src/jobs/execute-recovery.test.ts --no-file-parallelism
```

The test injects a retryable `Razorpay 5xx`, records `recovery.execution.failed` with decision `RETRYING`, reruns the same action, and verifies exactly one action row and one stored Payment Link reference. Queue retries use the bounded 2-second backoff declared in `packages/domain/src/queues.ts`.

## Pre-recording checklist

- [ ] Public web `/`, `/recoveries`, recovered case detail, `/about`, and `/demo/checkout` load.
- [ ] API `/health/live` and `/health`, plus worker `/health`, report healthy.
- [ ] Dashboard/API show hash `925ba5d2`, 500 payments, 1,500 outcomes, 63 escalations, and 8 prevented unnecessary interventions.
- [ ] The recovered case shows provider link status `paid`, 100 paise recovered, and `payment_link.paid.received`.
- [ ] The 5xx focused test passes and its result is captured.
- [ ] Capture backups: dashboard comparator, recovered case/audit, About architecture/safety, and 5xx test output.
- [ ] Record the walkthrough in the documented order; retain the recording outside Git unless it contains no sensitive data.
- [ ] Scan the staged repository and browser-visible configuration for secrets before submission.

## Final validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
git grep -nEI '(RAZORPAY_TEST_MODE_SECRET_KEY|RAZORPAY_WEBHOOK_SECRET|OPENAI_API_KEY|DATABASE_URL|REDIS_URL)=' -- ':!*.example' ':!README.md'
```

The final grep should return no secret assignments. Environment-variable names in `.env.example` and documentation are permitted; values are never committed.
