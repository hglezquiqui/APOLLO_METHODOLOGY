# Quickstart: Contract Expiry Notifications Validation

This guide validates the contract-expiry reminder feature end-to-end against the specification,
including annual/monthly lead times, renewal suppression, UTC logic, permanent deduplication, and
single catch-up behavior.

## Prerequisites

- Node.js runtime installed
- Dependencies installed in repository root
- Feature branch checked out: `001-contract-expiry-notifications`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build project:

```bash
npm run build
```

3. Start service:

```bash
npm start
```

## Validation Scenarios

### Scenario 1: Annual and monthly eligibility

- Action: Trigger reminder run with a `runAtUtc` that makes one annual contract hit 30-day threshold
  and one monthly contract hit 7-day threshold.
- Expected:
  - `notifiedCount` increments for each eligible contract.
  - Lead-time logic uses UTC boundaries.

Reference: [spec.md](./spec.md), [data-model.md](./data-model.md)

### Scenario 2: Renewal-effective suppression

- Action: Mark a contract as renewed with an effective timestamp <= run time, then run endpoint.
- Expected:
  - No email sent for that contract.
  - `skippedRenewedCount` increments.

Reference: [spec.md](./spec.md)

### Scenario 3: Permanent deduplication

- Action: Run the same reminder event multiple times (including same day).
- Expected:
  - Reminder for same contract term + lead-time is sent at most once.
  - `skippedDuplicateCount` increments on repeated attempts.

Reference: [data-model.md](./data-model.md)

### Scenario 4: Missed threshold catch-up

- Action: Simulate missed exact threshold run and execute next available run where event is still
  unsent.
- Expected:
  - Exactly one catch-up reminder is sent.
  - `catchUpSentCount` increments once.

Reference: [spec.md](./spec.md)

## API Trigger Example

```bash
curl -X POST http://localhost:3000/contracts/expiry-reminders/run \
  -H "Content-Type: application/json" \
  -d '{"runAtUtc":"2026-08-12T16:00:00.000Z"}'
```

See API contract: [contracts/reminder-run.openapi.yaml](./contracts/reminder-run.openapi.yaml)

## Validation Run Results (Captured)

Reference execution timestamp: `2026-08-12T16:00:00.000Z`

Observed summary:

```json
{
  "processedContracts": 4,
  "notifiedCount": 1,
  "skippedRenewedCount": 1,
  "skippedDuplicateCount": 0,
  "skippedIneligibleCount": 2,
  "catchUpSentCount": 1
}
```

Interpretation:

- One eligible reminder email was sent.
- One contract was suppressed due to effective renewal.
- One catch-up notification was sent for a missed threshold run.
- No duplicate reminder event was emitted in this run.

## Validation Exit Criteria

- All scenarios above pass with expected counters and suppression behavior.
- No duplicate reminder event is emitted for same contract term + lead-time.
- UTC-based eligibility is verifiable from test data and run outputs.
