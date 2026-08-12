# Data Model: Contract Expiry Notifications

## Entity: Contract
- Purpose: Represents an active contract term evaluated for reminder eligibility.
- Fields:
  - id (string, required, unique)
  - title (string, required)
  - cadence (enum: annual | monthly, required)
  - expiresAtUtc (ISO 8601 UTC timestamp, required)
  - ownerId (string, required)
  - renewalStatus (enum: active | renewed | unknown, required)
  - renewalEffectiveAtUtc (ISO 8601 UTC timestamp, nullable; required when renewalStatus=renewed)
- Validation rules:
  - cadence must be annual or monthly for this feature.
  - expiresAtUtc must include UTC timezone designator.
  - renewalStatus=renewed requires renewalEffectiveAtUtc.

## Entity: ContractOwner
- Purpose: Recipient of reminder emails.
- Fields:
  - id (string, required, unique)
  - name (string, required)
  - email (string, required, valid email format)

## Entity: ReminderEvent
- Purpose: Auditable identity for a send decision and deduplication record.
- Fields:
  - reminderEventId (derived string, unique)
  - contractId (string, required)
  - contractTermId (string, required)
  - leadTimeDays (integer, required; allowed values: 30, 7)
  - thresholdAtUtc (ISO 8601 UTC timestamp, required)
  - notifiedAtUtc (ISO 8601 UTC timestamp, required)
  - dispatchStatus (enum: sent | skipped_renewed | skipped_duplicate | skipped_ineligible, required)
- Identity and uniqueness:
  - Unique key: (contractTermId, leadTimeDays)
  - This key enforces permanent one-send behavior per reminder event.

## Entity: NotificationRunSummary
- Purpose: Observability record for each job execution.
- Fields:
  - runId (string, required, unique)
  - runAtUtc (ISO 8601 UTC timestamp, required)
  - processedContracts (integer, required)
  - notifiedCount (integer, required)
  - skippedRenewedCount (integer, required)
  - skippedDuplicateCount (integer, required)
  - skippedIneligibleCount (integer, required)
  - catchUpSentCount (integer, required)

## Lifecycle and state transitions
- Contract reminder eligibility states:
  - ineligible -> eligible_threshold -> sent
  - ineligible -> eligible_catchup -> sent
  - eligible_threshold -> skipped_renewed (if renewal effective at run time)
  - eligible_threshold|eligible_catchup -> skipped_duplicate (if reminder event already sent)
- Renewal impact:
  - renewalStatus becomes renewed with effective timestamp.
  - suppression starts when runAtUtc >= renewalEffectiveAtUtc.

## Repository contract implications
- `ContractRepository` must support:
  - Listing active contracts and required reminder evaluation fields.
  - Checking existing reminder events by unique key.
  - Recording sent reminder events and skip outcomes needed for audit/reporting.
- No ORM is introduced; repository remains the sole data boundary for this feature.
