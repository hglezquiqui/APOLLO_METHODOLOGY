# Feature Specification: Contract Expiry Notifications

**Feature Branch**: `[001-contract-expiry-notifications]`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Notify contract owners automatically before their contract expires. Annual contracts should notify 30 days in advance; monthly contracts should notify 7 days in advance. Do not notify if the contract has already been renewed. A contract must never receive the notification twice, even if the notification job runs more than once on the same day."

## Clarifications

### Session 2026-08-12

- Q: Should a contract reminder event be blocked from duplicate sends only within the same calendar day, or forever for that contract term and lead-time? → A: Block duplicates forever for the same contract term and lead-time.
- Q: Which timezone should define when a contract is considered exactly 30 or 7 days from expiry for notification eligibility? → A: Use UTC only for lead-time eligibility.
- Q: When should a contract be treated as renewed for suppression: only if renewal is effective at run time, or as soon as a future renewal is signed? → A: Suppress only when renewal is already effective at run time.
- Q: If the job misses the exact 30-day or 7-day trigger because of downtime, should it send a late catch-up reminder at the next run? → A: Send one late catch-up reminder at next run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Timely pre-expiry notification delivery (Priority: P1)

As a contract owner, I want to receive an automatic reminder before expiration so I can take action before service or legal coverage lapses.

**Why this priority**: This is the core business outcome and the only direct user value in this feature.

**Independent Test**: Can be fully tested by processing eligible annual and monthly contracts and verifying reminder delivery timing rules for each contract type.

**Acceptance Scenarios**:

1. **Given** an annual contract that expires in exactly 30 days and is not renewed, **When** the notification job runs, **Then** the owner receives one reminder for that contract.
2. **Given** a monthly contract that expires in exactly 7 days and is not renewed, **When** the notification job runs, **Then** the owner receives one reminder for that contract.

---

### User Story 2 - Renewal-aware notification suppression (Priority: P1)

As a contract owner, I do not want unnecessary reminders once my contract has already been renewed.

**Why this priority**: Sending reminders after renewal creates confusion and reduces trust in contract operations.

**Independent Test**: Can be fully tested by marking contracts as renewed before a run and verifying that no reminder is produced.

**Acceptance Scenarios**:

1. **Given** a contract that meets timing rules but is marked as renewed, **When** the notification job runs, **Then** no reminder is sent.
2. **Given** a contract that has already been renewed after a prior reminder cycle, **When** a later notification job runs, **Then** no new reminder is sent for that term.

---

### User Story 3 - Idempotent runs without duplicate owner messages (Priority: P1)

As a contract owner, I should never receive the same reminder twice, even if the notification job is triggered repeatedly on the same day.

**Why this priority**: Duplicate reminders degrade user confidence and can create unnecessary follow-up work.

**Independent Test**: Can be fully tested by executing the same notification run multiple times on the same day and confirming one reminder maximum per contract reminder event.

**Acceptance Scenarios**:

1. **Given** an eligible contract reminder event was already sent today, **When** the same notification job is run again today, **Then** no duplicate reminder is sent.
2. **Given** multiple job retries occur after a partial failure, **When** retries include contracts already notified for that reminder event, **Then** previously notified contracts are skipped.

---

### Edge Cases

- What happens when a contract expiration date is in the past at job time? The system skips notification.
- What happens when a contract has an unsupported billing cadence other than annual or monthly? The system excludes it from this feature scope and records it for operational review.
- What happens when renewal status is missing or unknown? The system treats the contract as not eligible until renewal status is known.
- What happens when the same owner has multiple contracts becoming eligible on the same day? Each eligible contract generates its own single reminder event.
- What happens when UTC and local date boundaries differ for an owner? Eligibility remains determined by UTC boundaries.
- What happens when a renewal is signed but has a future effective date? Reminder suppression begins only once the effective timestamp is reached.
- What happens when a job outage skips an exact threshold run? A single catch-up reminder is sent at the next run if that reminder event has not been sent before.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST evaluate active contracts on each job run and identify contracts whose expiration lead-time threshold is reached.
- **FR-002**: System MUST send a pre-expiry reminder for annual contracts that are not renewed at the 30-day threshold, or as a single late catch-up if the exact threshold run was missed.
- **FR-003**: System MUST send a pre-expiry reminder for monthly contracts that are not renewed at the 7-day threshold, or as a single late catch-up if the exact threshold run was missed.
- **FR-004**: System MUST NOT send any pre-expiry reminder when a contract renewal is effective at job run time.
- **FR-005**: System MUST prevent duplicate reminder delivery forever for the same contract term and lead-time reminder event, including repeated runs on the same day.
- **FR-006**: System MUST keep an auditable reminder record that allows determining whether a reminder event for a specific contract term and lead-time was already sent at any prior time.
- **FR-007**: System MUST produce run-level results indicating how many contracts were evaluated, notified, skipped as renewed, and skipped as duplicates.
- **FR-008**: System MUST evaluate 30-day and 7-day lead-time eligibility using UTC-based timestamps and UTC date boundaries.

### Key Entities *(include if feature involves data)*

- **Contract**: Represents an agreement with an owner, including contract cadence (annual or monthly), expiration date, renewal status, and renewal effective timestamp.
- **Contract Owner**: Represents the recipient of pre-expiry reminders and contact destination details.
- **Reminder Event**: Represents a unique reminder instance tied to a contract term and reminder threshold, used for permanent deduplication and auditability.
- **Notification Run Summary**: Represents the job execution outcome counts and timestamps for monitoring and verification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of eligible annual contracts receive exactly one reminder per reminder event, either at the 30-day threshold or as one late catch-up when the threshold run is missed.
- **SC-002**: 100% of eligible monthly contracts receive exactly one reminder per reminder event, either at the 7-day threshold or as one late catch-up when the threshold run is missed.
- **SC-003**: 0 reminders are sent for contracts marked as renewed in validation runs.
- **SC-004**: Duplicate reminder rate for the same contract reminder event is 0%, including repeated job executions on the same day.

## Assumptions

- Only annual and monthly contract cadences are in scope for this feature.
- Each contract has one active term and a clear, queryable renewal status at evaluation time.
- Contract expiration and job execution timestamps are available in UTC.
- A contract owner has at least one valid notification destination.
- This feature concerns notification decisioning and duplicate prevention; message content design is handled separately.
