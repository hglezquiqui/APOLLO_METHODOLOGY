# Phase 0 Research: Contract Expiry Notifications

## Decision 1: Keep service-layer orchestration in `src/services/`
- Decision: Implement reminder decisioning and orchestration inside service classes in `src/services/`, with route handler in `src/index.ts` calling one service entrypoint.
- Rationale: This matches the existing project structure and keeps HTTP concerns separate from business logic.
- Alternatives considered:
  - Put reminder logic directly in route handler: rejected due to lower testability and mixed concerns.
  - Add a new architecture layer: rejected as unnecessary complexity for current scope.

## Decision 2: Use `ContractRepository` for data access and persistence
- Decision: Read contract terms and write reminder-event audit state exclusively through `ContractRepository` methods.
- Rationale: User constraint requires repository usage, and constitution stack constraints favor existing abstractions.
- Alternatives considered:
  - Direct SQL from service: rejected to preserve abstraction boundaries.
  - Introduce ORM models: rejected per explicit instruction to avoid ORM.

## Decision 3: Send reminders through `EmailService`
- Decision: Notification dispatch contract for this feature is `EmailService` (or adapter-compatible equivalent), used by the reminder service.
- Rationale: User instruction explicitly mandates EmailService as outbound channel.
- Alternatives considered:
  - Generic notification interface only: rejected because requirement is specifically email.
  - Console-only sender: rejected for production intent; acceptable only in local test stub.

## Decision 4: UTC-first eligibility calculations
- Decision: Evaluate 30-day and 7-day eligibility using UTC timestamps and UTC day boundaries.
- Rationale: Clarified in spec and aligned with constitution date/time integrity principle.
- Alternatives considered:
  - Owner-local timezone: rejected because current clarified requirement is UTC-only.
  - Server-local timezone: rejected due to drift and ambiguity risk.

## Decision 5: Renewal suppression uses effective timestamp
- Decision: Suppress reminder sends only when renewal is effective at run time; future-dated signed renewals do not suppress until effective.
- Rationale: Matches clarified user decision and prevents premature suppression.
- Alternatives considered:
  - Suppress immediately when signed: rejected because it can hide needed reminders before effective date.

## Decision 6: Permanent deduplication key
- Decision: Deduplicate permanently by reminder event identity: contract term + lead-time threshold.
- Rationale: Clarified requirement states no duplicate reminder for the same event, including repeated same-day runs.
- Alternatives considered:
  - Same-day-only dedup: rejected as insufficiently strict.
  - Time-window dedup: rejected due to possible accidental repeats beyond window.

## Decision 7: Missed-run catch-up behavior
- Decision: If exact threshold run is missed (for example downtime), send one catch-up reminder at next run if event not already sent.
- Rationale: Clarified requirement favors reliability while preserving one-send guarantee.
- Alternatives considered:
  - No catch-up: rejected due to missed owner notifications during outages.
  - Repeated catch-up attempts without idempotency guard: rejected due to duplicate risk.
