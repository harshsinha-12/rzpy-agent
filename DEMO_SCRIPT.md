# RecoveryOS final judge walkthrough

Use the deployed URLs and the known-good evidence listed in [SUBMISSION.md](./SUBMISSION.md). Say `SIMULATED` whenever discussing batch figures and `RAZORPAY_TEST_MODE` for the ₹1 Payment Link proof. Neither represents live merchant revenue.

0. **Open on the landing.** Start at `/` so the recovery loop is clear in under a minute, then click **Open dashboard** to enter `/dashboard`.
1. **Start with measured money.** “This frozen `SIMULATED` batch puts ₹28,75,582 at risk. Across the same 500 failed-payment inputs, no intervention recovers ₹3,33,131 and naive immediate retry recovers ₹5,50,591.”
2. **Show the RecoveryOS comparison.** “RecoveryOS recovers ₹13,34,223, or 45.2%, from the identical outcome rolls. It makes 336 attempts, 79 simulated contacts, stops 164 unsafe cases, escalates 63 for human review, and prevents 8 unnecessary interventions.”
3. **Show the difference.** “That is +₹7,83,632 incremental `SIMULATED` recovery over naive retry—not a live merchant-revenue claim. The fixed seed is `20260821`, the configuration hash is `925ba5d2`, and all 1,500 outcomes are stored.”
4. **Move to a real Test Mode event.** In Reported Issues, filter to `RAZORPAY_TEST_MODE` and open the recovered ₹1 case. “This is a separate, paid Razorpay Test Mode proof: Razorpay’s signed failed-payment event became one durable case.”
5. **Trace the decision.** Show normalized payment facts, deterministic diagnosis, the GPT-5.6 Terra proposal, and the policy decision. “AI proposes one schema-validated action from read-only facts. Deterministic policy—not the model—checks payment state, consent, limits, cooldown, recovery window, and duplicate work.”
6. **Show bounded execution and outcome.** Show the `CREATE_PAYMENT_LINK` action, `payment_link.paid.received` audit event, provider status `paid`, case `RECOVERED`, and 100 paise recovered. “The action is silent and action-bound; a payment-state recheck and stable IDs prevent duplicate execution.”
7. **Show graceful failure, not a second live payment.** Run the focused retry test and show that one injected Razorpay 5xx records `RETRYING`, then succeeds with one action row and one Payment Link reference. “The worker retries with 2-second bounded backoff; it never creates a duplicate link.”
8. **End on incremental recovery.** Return to `/dashboard` for the comparison. “Razorpay tells a merchant a payment failed. RecoveryOS determines the safest next step, proves the action and audit trail, and measures +₹7,83,632 incremental `SIMULATED` recovery.”
