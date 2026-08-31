# Razorpay Hackathon - AI Revenue Recovery Agent

## 1. Executive Summary

### Idea

Build an **AI Revenue Recovery Agent for Razorpay merchants** that continuously identifies failed or at-risk payments, diagnoses why revenue is being lost, determines the best recovery strategy, executes a bounded intervention, and tracks how much revenue was actually recovered.

The core loop is:

**Detect → Diagnose → Decide → Execute → Observe → Recover / Escalate / Stop**

Instead of simply showing merchants:

> "₹2,499 payment failed"

the system tells them:

> "₹2,499 failed because of a transient gateway error. Similar failures have a high recovery probability. Retry was intentionally delayed for 5 minutes. Customer was not contacted unnecessarily. Payment recovered successfully."

Every action is:

* explainable
* policy-bounded
* auditable
* idempotent
* measurable in ₹
* reversible or stoppable where possible

### North Star Metric

**Incremental Revenue Recovered**

```text
Incremental Recovery
=
Revenue recovered by our strategy
-
Revenue recovered by baseline strategy
```

Supporting metrics:

* ₹ revenue at risk
* ₹ revenue recovered
* recovery rate
* recovery rate by failure reason
* recovery rate by intervention
* average attempts before recovery
* time to recovery
* messages sent per recovery
* intervention cost
* customers intentionally not contacted
* cases escalated
* cases stopped by policy

The strongest demo outcome would look like:

```text
Payment events analysed       250
Revenue at risk               ₹4,82,000
Revenue recovered             ₹3,01,400
Recovery rate                 62.5%

Naive baseline recovery       ₹2,14,000
Incremental recovery          ₹87,400

Attempts prevented            39
Customers not spammed         24
Cases escalated               11
Policy violations             0
```

Since Razorpay Test Mode does not move real money, these figures must be explicitly presented as **test-mode/simulated recovery results**, not real merchant revenue. Razorpay's test environment is specifically designed to simulate successful and failed payment outcomes.

### Confirmed Razorpay challenge contract — 2026-08-27

Razorpay's AI Revenue Recovery brief requires more than detecting a loss. The submission must show that an agent finds revenue at risk, determines an appropriate intervention, executes a bounded recovery workflow, and measures recovered money across a batch with compliant escalation, stopping rules, and an audit trail.

RecoveryOS will satisfy that contract through the focused direction already selected in this document:

```text
Payment degradation → root cause → recovery action
```

The remaining acceptance sequence is defined in `PLAN.md` Steps 12–16: healthy hosted runtimes, a signed Razorpay Test Mode failure webhook, one policy-gated AI recovery paid in Test Mode, frozen batch-level uplift evidence, and a repeatable judge demo.

The other official Track 03 example directions are planned as `PLAN.md` Steps 17–22 after that loop is proven:

| Official example | Planned treatment |
| --- | --- |
| Checkout drop-off recovery | Merchant selects unpaid checkouts and sends a policy-gated recovery email. |
| Failed-subscription recovery | Same select-and-email pattern for pending or halted recurring charges. |
| B2B receivables chaser | Overdue invoices raise a human-in-the-loop alert before outreach. |
| Mandate retry sequencer | Sequenced retries plus selected email and a human alert when retry is unsafe. |
| Hinglish voice recovery | OpenAI-generated recovery message the customer would receive; merchant can play it in the product. |
| Promise-to-pay tracker | Udhaar records with a month-end due date, Hindi reminder, and generated voice recovery message. |

---

# 2. The Problem

Payments fail for very different reasons.

A customer entering an incorrect OTP is fundamentally different from:

* insufficient balance
* bank downtime
* gateway degradation
* Razorpay-side transient issue
* invalid merchant integration
* expired card
* cancelled mandate
* abandoned checkout

Yet most recovery systems eventually collapse these situations into:

```text
Payment failed
      ↓
Retry
      ↓
Reminder
      ↓
Another reminder
```

That is inefficient and can actively make the user experience worse.

Razorpay already exposes structured payment failure information including:

```text
error_code
error_description
error_source
error_step
error_reason
```

and distinguishes sources such as the customer, business, gateway, Razorpay, issuer bank, and others depending on the payment method.

That gives us exactly the signal required to build a **recovery decision engine** rather than another retry script.

---

# 3. Product Concept

## RecoveryOS

Think of the product as an autonomous revenue recovery layer sitting on top of Razorpay.

```text
                 RAZORPAY
                    │
             Payment Events
                    │
                    ▼
         ┌────────────────────┐
         │ Revenue Detector   │
         └─────────┬──────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Failure Diagnosis  │
         └─────────┬──────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Recovery Agent     │
         │                    │
         │ Decide what to do  │
         └─────────┬──────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Policy Engine      │
         │                    │
         │ Can we do this?    │
         └─────────┬──────────┘
                   │
        ┌──────────┼──────────────┐
        ▼          ▼              ▼
      Retry      Notify       Payment Link
        │          │              │
        └──────────┼──────────────┘
                   ▼
             Observe Result
                   │
          ┌────────┴────────┐
          ▼                 ▼
       RECOVERED          FAILED
                            │
                    Retry / Escalate /
                          STOP
```

---

# 4. Scope the Hackathon Correctly

The temptation would be to support everything:

* subscriptions
* checkout abandonment
* failed UPI
* cards
* invoices
* B2B receivables
* voice recovery
* mandates

Don't.

For the hackathon, build one extremely polished system around:

## Payment Failure → Root Cause → Recovery Action

Then optionally demonstrate subscription recovery as a secondary workflow.

This gives us enough depth without turning the project into seven half-built features.

---

# 5. Primary User Story

Imagine an online merchant processing payments through Razorpay.

A customer attempts:

```text
Order: ORD_30291
Amount: ₹4,999
Method: UPI
Status: FAILED
```

Webhook arrives.

Our system creates:

```text
Recovery Case #RC1024

Amount at risk
₹4,999

Failure source
gateway

Failure stage
payment_processing

Failure reason
gateway_timeout

Recoverability
HIGH

Recommended intervention
Wait 5 minutes and provide another payment opportunity

Confidence
0.87
```

The policy engine then checks:

```text
Attempts in previous 24h < limit?          YES
Customer contacted recently?               NO
Failure is retryable?                      YES
Merchant policy allows intervention?       YES
Duplicate recovery running?                NO
```

Only then is an action scheduled.

---

# 6. Recovery Strategies

The intelligence comes from treating different failures differently.

## Case A - Gateway / Network Failure

```text
gateway_timeout
       ↓
Likely transient
       ↓
Don't contact immediately
       ↓
Wait 3-5 minutes
       ↓
Offer another payment attempt
       ↓
If failure persists
       ↓
Suggest alternate payment method
```

---

## Case B - Incorrect OTP

```text
incorrect_otp
       ↓
Customer-action failure
       ↓
Immediate contextual explanation
       ↓
Allow another attempt
       ↓
No repeated delayed spam
```

---

## Case C - Insufficient Balance

```text
insufficient_funds
       ↓
Immediate retry has low value
       ↓
Delay intervention
       ↓
Create recovery payment path
       ↓
Send one reminder
       ↓
Wait
```

---

## Case D - Merchant Integration Error

```text
error_source = business
       ↓
STOP CUSTOMER RECOVERY
       ↓
Do not message customer
       ↓
Create merchant alert
       ↓
Escalate integration issue
```

This is a particularly good demo case.

The agent understands that asking the customer to retry cannot fix a merchant integration bug.

Razorpay's documentation similarly categorises business-originated failures as integration issues that the business must fix.

---

## Case E - Razorpay / Gateway Transient Failure

```text
error_source = razorpay / gateway
       ↓
Temporary infrastructure problem
       ↓
Cooldown
       ↓
Retry opportunity
       ↓
Alternative method if repeated
```

---

## Case F - Repeated Customer Failure

```text
Attempt 1
    ↓
Attempt 2
    ↓
Attempt 3
    ↓
STOP
    ↓
Escalate or let customer return organically
```

The agent is explicitly forbidden from endlessly recovering.

---

# 7. Subscription Recovery

Subscriptions give us another compelling recovery case.

Razorpay already automatically retries failed subscription charges. For card subscriptions, its documented retry flow can move a subscription through states such as `pending` and eventually `halted`.

Therefore our system should **not duplicate Razorpay's retry engine**.

Instead:

```text
subscription.pending
        ↓
Recovery Agent
        ↓
Understand failure
        ↓
Wait for Razorpay automatic retry
        ↓
Observe outcome
        ↓
If retries continue failing
        ↓
Request payment-method update
        ↓
subscription.halted
        ↓
Escalate recovery strategy
```

This makes the system complementary to Razorpay rather than reinventing Razorpay.

---

# 8. Agent Architecture

This is where the project plays directly into my previous work with agentic financial systems.

I would structure it similarly to the agent/tool architecture I used while building Ask Iris:

```text
                    Recovery Orchestrator
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 Failure Analyzer     Strategy Agent       Policy Engine
       │                    │                    │
       ▼                    ▼                    ▼
Structured Facts      Proposed Action       Allow / Reject
                            │
                            ▼
                     Execution Layer
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      Payment Link       Reminder        Scheduler
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                       Event Stream
                            │
                            ▼
                       Audit Trail
```

## Important Principle

**The LLM does not directly execute money actions.**

The LLM can produce:

```json
{
  "diagnosis": "transient gateway failure",
  "recoverability": 0.84,
  "recommended_action": "CREATE_PAYMENT_LINK",
  "delay_minutes": 5,
  "reason": "Repeated immediate gateway retries are unlikely to improve recovery."
}
```

But execution happens through deterministic tools.

```text
LLM
 ↓
Action Proposal
 ↓
Policy Validation
 ↓
Tool Execution
```

This is exactly how I would design a production financial agent as well.

---

# 9. Available Agent Tools

Give the agent a small tool surface.

```text
getPayment(paymentId)

getOrder(orderId)

getCustomerRecoveryHistory(customerId)

getMerchantRecoveryPolicy(merchantId)

createRecoveryPaymentLink(caseId)

scheduleRecovery(caseId, time)

sendRecoveryMessage(caseId, channel)

suggestAlternativePaymentMethod(caseId)

escalateCase(caseId)

closeRecoveryCase(caseId)

stopRecovery(caseId)
```

Potential analytics tools:

```text
getFailureRate(method, window)

getRecoveryRate(strategy)

getCustomerAttemptCount(customerId)

getMerchantPaymentHealth()

getRecentGatewayFailureRate()
```

---

# 10. Razorpay Integration

### Webhooks

Listen to relevant Razorpay events.

At minimum:

```text
payment.failed
payment.captured
payment.authorized
```

Potential subscription extension:

```text
subscription.pending
subscription.halted
subscription.charged
```

Razorpay webhooks are asynchronous and should be handled idempotently. Razorpay also recommends considering API polling for business-critical state confirmation.

So our ingestion should look like:

```text
Webhook
   ↓
Verify signature
   ↓
Store raw event
   ↓
Check event idempotency
   ↓
ACK webhook quickly
   ↓
Push job to queue
   ↓
Process asynchronously
```

Exactly the sort of flow BullMQ is excellent for.

---

# 11. Payment Recovery Using Payment Links

For recoveries where we need the customer to complete another payment:

```text
POST /v1/payment_links
```

Razorpay's Payment Links API allows creation, retrieval, modification, cancellation and notification workflows.

The recovery agent can generate:

```text
₹4,999 payment failed

Reason:
Bank gateway temporarily unavailable

Recovery action:
New payment opportunity generated

Expires:
30 minutes

Reference:
RECOVERY_RC1024
```

Important hackathon constraint:

Razorpay currently limits Standard Payment Link creation in Test Mode to **30 links per business**.

Therefore:

* actually execute a small number of Razorpay recovery cases
* simulate the large evaluation batch locally
* don't try generating 200 Razorpay Payment Links

Also, dedicated UPI Payment Links are currently not supported in Test Mode, although regular Checkout supports UPI test flows such as `success@razorpay` and `failure@razorpay`.

For the single paid recovery-link proof, use a Standard Payment Link's **Netbanking** option, choose any demo bank, and select **Success** on Razorpay's mock-bank page. This is the documented Test Mode completion path: it is deterministic, requires no SMS OTP, and remains explicitly Test Mode rather than merchant revenue.

---

# 12. The Policy Engine

This is probably one of the most important components for judging.

Example policy:

```typescript
{
  maxAttemptsPerCase: 3,
  maxMessagesPerDay: 2,
  minimumRetryDelayMinutes: 3,
  recoveryWindowHours: 48,
  allowedActions: [
    "CREATE_PAYMENT_LINK",
    "SEND_REMINDER",
    "WAIT",
    "ALTERNATIVE_METHOD",
    "ESCALATE",
    "STOP"
  ]
}
```

Before executing anything:

```text
Strategy proposed
       ↓
Policy Engine
       ↓
┌─────────────────────────────┐
│ Amount within limits?       │
│ Attempts remaining?         │
│ Recovery window active?     │
│ Action permitted?           │
│ Duplicate execution?        │
│ Customer contact allowed?   │
└─────────────────────────────┘
       ↓
ALLOW / DENY
```

A denied action should also appear in the audit log.

```text
Agent proposed:
SEND_REMINDER

Decision:
DENIED

Reason:
Customer already received maximum 2 recovery messages today.

Action:
WAIT

Money action executed:
NO
```

That's a great judge-facing moment.

---

# 13. Idempotency

Payments + queues + webhooks are exactly where duplicate execution becomes dangerous.

Create a key such as:

```text
recovery:{payment_id}:{action}:{attempt}
```

Store it transactionally.

Before executing:

```text
if actionAlreadyExecuted:
    return previousResult
```

Use Redis for fast locks/idempotency and Postgres as durable source of truth.

This directly uses the kind of queue-based backend architecture I've already built using TypeScript, Redis and BullMQ.

---

# 14. Queue Architecture

BullMQ fits this beautifully.

```text
payment-events
      ↓
diagnosis-jobs
      ↓
recovery-decisions
      ↓
scheduled-recoveries
      ↓
execution-jobs
      ↓
verification-jobs
```

Example:

```text
payment.failed
      ↓
diagnosis job

gateway timeout
      ↓
strategy = WAIT_5_MIN

BullMQ delayed job
      ↓
5 minutes later

re-check payment status
      ↓

still failed?
    YES → create recovery action
    NO  → close case
```

This is considerably better than keeping an agent process alive for five minutes.

---

# 15. Database Design

## PaymentEvent

```text
id
merchant_id
razorpay_payment_id
razorpay_order_id
event_type
amount
currency
payment_method
status

error_code
error_source
error_step
error_reason
error_description

created_at
raw_payload
```

---

## RecoveryCase

```text
id
payment_id
merchant_id
customer_id

amount_at_risk

status
recoverability_score

diagnosis
failure_category

opened_at
closed_at

recovered_amount
```

Possible status values:

```text
OPEN
DIAGNOSING
WAITING
ACTION_REQUIRED
RECOVERY_RUNNING
RECOVERED
ESCALATED
STOPPED
EXHAUSTED
```

---

## RecoveryAction

```text
id
case_id

action_type

proposed_by
reason
confidence

policy_decision

scheduled_for
executed_at

result
razorpay_reference

created_at
```

---

## AuditEvent

```text
id
case_id

actor
event_type

input
decision
reasoning
output

timestamp
```

---

# 16. Recovery Intelligence

For the first version, don't train a model.

Use:

### Layer 1 - Deterministic classification

```text
error_source
error_step
error_reason
method
attempt_count
```

to generate a failure category.

### Layer 2 - Historical recovery statistics

Example:

```text
gateway_timeout
payment_method = UPI
attempt = 1

historical recoveries:

WAIT_5_MIN                72%
IMMEDIATE_RETRY           43%
ALTERNATIVE_METHOD        61%
MESSAGE_CUSTOMER          38%
```

### Layer 3 - LLM reasoning

Provide:

```text
failure
customer context
merchant policy
historical strategy performance
previous attempts
```

and ask the model to choose among **allowed strategies only**.

This gives us AI reasoning without giving the AI uncontrolled autonomy.

---

# 17. Why Not Just Hardcode Everything?

This should come up during judging.

Because recovery gets contextual quickly.

Consider:

```text
Failure: insufficient funds
Amount: ₹499
Customer: repeat subscriber
Previous recovery: evening retry successful
Attempts today: 0
```

versus:

```text
Failure: insufficient funds
Amount: ₹75,000
Customer: first-time customer
Previous attempts: 3
Risk flag: high
```

Same error.

Completely different appropriate action.

Rules define the **safety envelope**.

AI chooses the best strategy **inside that envelope**.

---

# 18. Synthetic Recovery Simulator

This is critical because the track explicitly asks for **measured money recovered across a batch**.

Create roughly:

```text
500 synthetic payments
```

with:

```text
amount
method
failure_reason
failure_source
customer_type
previous_attempts
hour_of_day
historical_success
```

Example distribution:

```text
25% gateway/network failures
20% insufficient balance
15% authentication failures
10% customer abandonment
10% merchant errors
10% issuer failures
10% miscellaneous
```

Each failure type gets hidden recovery probabilities.

Example:

```text
gateway_timeout:

immediate_retry       0.40
wait_5_min            0.75
alternative_method    0.58
message               0.35
```

The agent does not see those probabilities directly.

The simulator evaluates the agent's action.

---

# 19. Baseline Comparison

Without a baseline:

> "We recovered 62%"

doesn't mean much.

Compare against:

## Baseline A

```text
Always retry immediately.
```

## Baseline B

```text
Retry once + send reminder.
```

## Agent

```text
Contextual strategy selection.
```

Then display:

| Strategy        | Recovery Rate | ₹ Recovered |
| --------------- | ------------: | ----------: |
| No intervention |           31% |      ₹1.50L |
| Naive retry     |           44% |      ₹2.14L |
| Recovery Agent  |       **62%** |  **₹3.01L** |

The number we sell:

> **+₹87,000 incremental revenue versus naive recovery.**

That is your hackathon ROI metric.

---

# 20. Evaluation Harness

This is another area where my previous experience is directly useful.

I already worked on evaluation harnesses around agentic workflows, measuring things such as tool correctness, citation quality, latency and failure states.

I'd apply the same philosophy here.

Evaluate:

```text
Diagnosis accuracy
Strategy selection accuracy
Policy compliance
Tool-call correctness
Duplicate-action rate
Recovery rate
Incremental recovered amount
Average number of interventions
False intervention rate
```

## Safety Metric

Define:

```text
False Intervention
=
Agent executes recovery action
when the correct action was STOP
```

Example:

Merchant integration is broken.

Customer cannot fix it.

If the system sends the customer three reminders:

```text
False Intervention = 1
```

This is an especially strong metric because it proves we care about both revenue and customer experience.

---

# 21. Failure Handling Demo

The hackathon explicitly asks for one gracefully handled failure.

I'd deliberately create this:

```text
Razorpay payment.failed webhook
              ↓
Recovery agent proposes payment link
              ↓
Razorpay API temporarily returns 5xx
```

System behavior:

```text
Execution failed

NO duplicate payment link generated

BullMQ schedules retry

Idempotency key preserved

Retry #1
    ↓
success

Audit trail records both attempts
```

Dashboard:

```text
12:34:01
CREATE_PAYMENT_LINK requested

12:34:02
FAILED - Razorpay API unavailable

12:34:02
Retry scheduled

12:35:02
Retry executed

12:35:03
SUCCESS

Duplicate actions: 0
```

This demonstrates actual production engineering instead of a happy-path prototype.

---

# 22. Dashboard

The home page should be extremely visual.

## Top KPIs

```text
Revenue At Risk

₹4,82,000


Recovered

₹3,01,400


Recovery Rate

62.5%


Incremental Revenue

+₹87,400
```

Then:

### Recovery Funnel

```text
250 failed payments
        ↓
211 recoverable
        ↓
181 interventions
        ↓
154 recovered
```

### Failure Breakdown

```text
Gateway              31%
Customer              24%
Issuer                18%
Authentication        14%
Merchant               8%
Other                  5%
```

### Strategy Performance

```text
Wait + retry                 74%
Payment link                 63%
Alternative method           58%
Customer reminder            43%
Immediate retry              39%
```

### Reported Issues Table

The dashboard will also show reported payment and recovery issues in a filterable frontend table so the merchant can move from aggregate metrics to individual cases.

```text
Payment ID | Order ID | Amount | Method | Failure source | Failure reason | Recovery status | Recommended action | Policy decision | Last updated
```

The table should support:

* filtering by failure source, recovery status and payment method
* sorting by amount and latest activity
* searching by payment, order or recovery-case ID
* opening a row to view the complete recovery-case timeline, agent reasoning and audit trail

### Seeded Demo Data

The frontend and analytics will initially use a realistic seeded dataset of dummy payment failures and recovery cases. This ensures the reported-issues table, filters, charts, case timelines and revenue metrics are populated before any live demo events occur.

Seeded cases should cover:

* gateway timeout followed by successful recovery
* insufficient funds followed by a delayed payment link
* incorrect OTP followed by customer retry
* merchant integration error stopped by policy
* repeated customer failures stopped after the attempt limit
* Razorpay API failure retried without creating a duplicate action
* open, waiting, recovered, escalated, stopped and exhausted case states

Razorpay Test Mode webhook events will be written into the same database and displayed alongside seeded cases. Every record and metric must include a data-source label such as `SIMULATED` or `RAZORPAY_TEST_MODE`, so dummy outcomes are never presented as real merchant revenue.

---

# 23. Recovery Case UI

Click one payment.

Show:

```text
Recovery Case RC_2938

₹4,999
UPI

FAILED
```

Then a timeline:

```text
10:31:02

payment.failed received


10:31:03

Diagnosed:
Gateway timeout


10:31:04

Agent decision:
WAIT 5 MINUTES

Confidence:
87%


10:31:04

Policy:
APPROVED


10:36:04

Payment status checked

Still failed


10:36:05

Recovery payment link generated


10:40:51

Payment captured


RECOVERED ₹4,999
```

And beneath it:

### Why did the agent do this?

> The payment failed during processing at the gateway rather than because of customer input. Immediate customer intervention was therefore avoided. After the cooldown period, the payment remained unresolved, so the agent generated a new payment opportunity.

That's the "explain every money action" requirement nailed.

---

# 24. AI Chat Interface

Optional but very demo-friendly.

Merchant can ask:

> Why did revenue recovery drop today?

Agent:

```text
Recovery fell from 64% to 51%.

Primary contributor:

UPI gateway failures increased 2.4x between
14:00 and 15:30.

₹61,400 revenue was affected.

The recovery system intentionally delayed
43 retries because these failures were
classified as transient.

31 have subsequently recovered.

₹17,900 remains at risk.
```

Or:

> Show me cases where the AI intentionally didn't contact customers.

This makes the system feel like a real Razorpay merchant product.

---

# 25. Tech Stack

I would stay very close to my strongest stack.

```text
Frontend
Next.js
TypeScript
Tailwind
Recharts

Backend
Node.js
TypeScript
Fastify / Express

Database
PostgreSQL
Prisma

Async processing
Redis
BullMQ

Payments
Razorpay Test Mode APIs

AI
OpenAI API

Validation
Zod

Observability
Structured logs
Recovery audit events
```

No need for Kubernetes, Kafka or excessive infrastructure.

Hackathon architecture should look production-aware without becoming architecture cosplay.

---

# 26. Where My Existing Experience Helps

The project maps unusually well to the systems I've already built.

## Ask Iris → Recovery Agent

Ask Iris involved:

```text
User query
   ↓
Agent routing
   ↓
Tool selection
   ↓
SQL / RAG / Web
   ↓
Sub-agent reasoning
   ↓
Validated response
```

RecoveryOS becomes:

```text
Payment failure
   ↓
Agent routing
   ↓
Strategy selection
   ↓
Payment / Messaging / Scheduling tools
   ↓
Policy validation
   ↓
Verified recovery
```

Same agentic pattern.

Different domain.

---

## BullMQ experience → Recovery Scheduling

I've already built queue-driven TypeScript systems with BullMQ.

That maps directly to:

```text
delayed retries
scheduled interventions
recovery verification
webhook processing
idempotent jobs
dead-letter handling
```

---

## Fintech experience → Payment Reasoning

Working on stock research and financial systems means I already think about financial workflows as:

```text
structured data
+
business rules
+
AI reasoning
+
auditability
```

which is exactly what this problem needs.

---

## Evaluation Harness → Agent Evaluation

Instead of saying:

> "The agent seems smart"

we measure:

```text
diagnosis accuracy
tool-call accuracy
policy violations
money recovered
recovery uplift
false interventions
```

That mindset is a major differentiator.

---

# 27. API Structure

Example backend endpoints:

```text
POST /webhooks/razorpay

GET /recovery/cases
GET /recovery/cases/:id

POST /recovery/cases/:id/analyse

POST /recovery/cases/:id/execute

POST /recovery/cases/:id/stop

GET /analytics/overview

GET /analytics/recovery

GET /analytics/failures

POST /simulator/run
```

---

# 28. Recovery Agent Prompt

The system prompt should roughly establish:

```text
You are a payment revenue recovery agent.

Your objective is to maximise recoverable revenue
while minimising unnecessary customer interventions.

You may ONLY choose from supplied actions.

Never invent a payment status.

Never assume a payment failed permanently.

Never retry if merchant policy prohibits it.

Never contact a customer for merchant-side
integration failures.

Prefer WAIT when additional information is required.

Respect attempt limits and cooldown periods.

Every decision must include:

1. diagnosis
2. evidence
3. recommended action
4. confidence
5. reason
```

Output using structured JSON.

---

# 29. Deterministic Guardrails

The LLM should never be able to override:

```text
MAX_ATTEMPTS
MAX_MESSAGES
RECOVERY_WINDOW
ALLOWED_ACTIONS
MINIMUM_DELAY
CUSTOMER_OPT_OUT
MERCHANT_LIMITS
IDEMPOTENCY
PAYMENT_ALREADY_CAPTURED
```

Especially:

```typescript
if (payment.status === "captured") {
  return STOP;
}
```

No AI required.

---

# 30. Implementation Plan

## Phase 1 - Foundation

### Repository

```text
apps/
  web/
  api/

packages/
  database/
  razorpay/
  agents/
  recovery-engine/
  simulator/
  shared/
```

---

## Phase 2 - Database

Implement:

```text
Merchant
Customer
PaymentEvent
RecoveryCase
RecoveryAction
AuditEvent
RecoveryPolicy
```

Seed merchant configuration.

---

## Phase 3 - Razorpay

Implement:

```text
Razorpay client

createOrder()

fetchPayment()

fetchOrderPayments()

createPaymentLink()

webhook verification
```

Set everything to test mode.

---

## Phase 4 - Webhook Pipeline

```text
POST /webhooks/razorpay
       ↓
Verify signature
       ↓
Persist event
       ↓
Check idempotency
       ↓
BullMQ
       ↓
Create/update recovery case
```

---

## Phase 5 - Diagnosis Engine

Normalize Razorpay failures.

```typescript
type FailureCategory =
  | "CUSTOMER_AUTH"
  | "INSUFFICIENT_FUNDS"
  | "GATEWAY_TRANSIENT"
  | "ISSUER_FAILURE"
  | "MERCHANT_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";
```

Initially map deterministic Razorpay signals.

---

## Phase 6 - Recovery Agent

Pass:

```text
failure
amount
payment method
previous attempts
customer history
merchant policy
strategy statistics
```

Receive:

```text
diagnosis
recoverability
action
delay
confidence
reason
```

---

## Phase 7 - Policy Engine

Implement pure deterministic validator.

```text
proposal
   ↓
validateRecoveryAction()
   ↓
ALLOW / DENY
```

Log both outcomes.

---

## Phase 8 - Execution Tools

Implement:

```text
WAIT
CREATE_PAYMENT_LINK
SEND_REMINDER
ALTERNATIVE_METHOD
ESCALATE
STOP
```

---

## Phase 9 - BullMQ

Queues:

```text
payment-events
recovery-analysis
recovery-actions
recovery-verification
```

Use delayed jobs for scheduled recovery.

---

## Phase 10 - Simulator

Generate:

```text
250-500 synthetic failures
```

Run:

```text
baseline
vs
agent
```

Store every outcome.

---

## Phase 11 - Analytics

Calculate:

```text
revenueAtRisk

recoveredRevenue

recoveryRate

baselineRevenue

incrementalRevenue

averageAttempts

policyStops

falseInterventions
```

---

## Phase 12 - Dashboard

Build three pages.

### `/`

Executive dashboard.

### `/recoveries`

All cases.

### `/recoveries/[id]`

Full agent reasoning + audit timeline.

That's enough.

---

# 31. Hackathon Build Priority

If time becomes tight:

## P0 - Must Work

* Razorpay test mode
* payment failure webhook
* diagnosis
* recovery agent
* policy engine
* one real recovery action
* audit timeline
* synthetic batch
* recovered ₹ metric

## P1 - Strongly Desired

* BullMQ scheduling
* payment links
* baseline comparison
* failure analytics
* graceful API failure demonstration

## P2 - Nice to Have

* merchant chat
* subscription workflows
* adaptive strategy learning
* SMS/WhatsApp
* voice

Do **not** sacrifice the P0 flow for flashy P2 features.

---

# 32. Suggested 36-Hour Execution Sequence

## Hours 0-3

Architecture + Razorpay setup.

```text
Repo
Postgres
Prisma
Redis
Razorpay test credentials
basic dashboard
```

## Hours 3-7

Payment integration.

```text
orders
checkout
payment failures
webhooks
event persistence
```

## Hours 7-11

Recovery engine.

```text
failure classifier
strategy definitions
agent
structured output
```

## Hours 11-15

Policy + tools.

```text
policy validation
payment links
stop
escalate
wait
```

## Hours 15-19

BullMQ.

```text
async processing
delayed actions
verification
idempotency
```

## Hours 19-23

Simulator + metrics.

```text
synthetic batch
baseline
agent simulation
money recovered
```

## Hours 23-29

Frontend.

```text
dashboard
cases
case timeline
explainability
```

## Hours 29-32

Failure handling + testing.

```text
duplicate webhook
Razorpay API failure
already captured payment
policy violation
```

## Hours 32-36

Demo polish.

```text
seed perfect dataset
demo merchant
demo cases
charts
presentation
pitch
backup recording
```

---

# 33. The Demo Story

Do not begin the demo by explaining architecture.

Begin with money.

### Scene 1

Dashboard:

> **₹4.82 lakh revenue lost to failed payments today.**

Then:

> "Razorpay already tells the merchant that these payments failed. Our system answers the next question: what should we do about each one?"

---

### Scene 2

Trigger a Razorpay test payment.

Force failure.

Webhook arrives.

Case appears automatically.

```text
Payment failed
₹4,999

Source:
Gateway

Agent:
Transient failure

Decision:
WAIT

Reason:
Immediate customer intervention unnecessary
```

---

### Scene 3

Show policy engine.

```text
Agent wants:
WAIT → RECOVERY LINK

Policy:
APPROVED
```

---

### Scene 4

Show another case.

```text
Error source:
BUSINESS

Agent proposal:
ESCALATE

Customer message:
BLOCKED
```

Explain:

> "The customer cannot fix our merchant's integration bug, so the system explicitly prevents the AI from bothering them."

Very memorable.

---

### Scene 5

Complete recovery payment.

Webhook arrives.

Dashboard changes:

```text
Recovered revenue

₹2,96,401
      ↓
₹3,01,400
```

---

### Scene 6

Run batch simulation.

```text
250 failures

Naive recovery:
₹2.14L

RecoveryOS:
₹3.01L

Incremental:
+₹87.4K
```

Now judges understand the business value.

---

### Scene 7

Show audit trail.

```text
Why was this action taken?

Who approved it?

What API was executed?

What happened?

Was money recovered?
```

Everything visible.

---

# 34. One Graceful Failure

During the demo intentionally simulate:

```text
Recovery action
      ↓
Razorpay API failure
```

Show:

```text
Request failed
      ↓
No duplicate action
      ↓
Retry queued
      ↓
Backoff
      ↓
Successful execution
```

This directly satisfies the track's failure-handling requirement.

---

# 35. What Makes This Different

The pitch should NOT be:

> "We use AI to retry failed payments."

That's weak.

The differentiation is:

> **We treat payment recovery as a sequential decision problem.**

Every failed payment enters a recovery state machine.

The system continuously answers:

```text
What happened?

Is this recoverable?

Should anyone act?

What action has the highest expected value?

Are we allowed to execute it?

Did it work?

Should we try again?

When should we stop?
```

That's substantially more interesting.

---

# 36. Longer-Term Intelligence

If this became an actual Razorpay product, the decision engine could eventually learn:

```text
P(recovery | failure, strategy, context)
```

For each intervention:

```text
Expected Value(strategy)
=
P(recovery | context)
× payment value
-
intervention cost
-
customer friction cost
```

Then choose:

```text
argmax Expected Value(strategy)
```

subject to:

```text
risk constraints
customer constraints
merchant constraints
Razorpay policy
```

Now the system becomes a genuine **revenue optimisation engine**, not just a recovery bot.

---

# 37. Long-Term Razorpay Product Vision

Eventually Razorpay merchants could see:

```text
Razorpay Recovery AI

Recovered this month
₹8.42L

Incremental payment success
+4.7%

Customers automatically recovered
1,284

Unnecessary retries prevented
417
```

Merchant sets:

```text
Recovery aggressiveness

Conservative
Balanced
Aggressive
```

but those presets simply adjust the bounded policy layer.

The AI never gets unrestricted authority over payments.

---

# 38. Final Product Pitch

> **RecoveryOS is an autonomous revenue recovery layer for Razorpay merchants. It listens to payment failures, understands why each transaction failed, chooses the highest-probability recovery strategy, executes only policy-approved actions, and follows the payment until the money is recovered or the system knows when to stop. Every decision is explainable, every action is auditable, and success is measured in incremental rupees recovered.**

## 30-Second Version

> Merchants lose revenue every day because payment failures are treated alike even though their causes are completely different. RecoveryOS listens to Razorpay payment events, diagnoses each failure using Razorpay's structured signals, and uses an AI agent to decide whether to wait, retry through another flow, create a payment link, contact the customer, escalate, or stop. A deterministic policy engine gates every action. We then measure the system against a naive retry baseline and show exactly how many additional rupees it recovered.

## The Line I'd End the Demo With

> **Razorpay tells you when money fails. We built the agent that figures out how to get it back.**
