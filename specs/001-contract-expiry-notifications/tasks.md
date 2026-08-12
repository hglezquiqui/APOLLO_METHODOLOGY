# Tasks: Contract Expiry Notifications

**Input**: Design documents from `/specs/001-contract-expiry-notifications/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included because this feature has strict behavioral rules and the constitution requires verifiable coverage for changed behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare test and execution scaffolding for reminder workflow changes.

- [X] T001 Update npm scripts for test execution in package.json
- [X] T002 Add test compiler/include settings for tests in tsconfig.json
- [X] T003 [P] Create test directories and placeholder index files in tests/unit/.gitkeep and tests/integration/.gitkeep

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain and repository contracts required by all user stories.

**⚠️ CRITICAL**: No user story implementation should begin until this phase is complete.

- [X] T004 Extend contract domain fields for cadence and renewal-effective metadata in src/types/contract.ts
- [X] T005 Add reminder-event and run-summary domain types in src/types/contract.ts
- [X] T006 Refine ContractRepository interface for event lookup, event record, and summary counters in src/data/inMemoryContractRepository.ts
- [X] T007 [P] Implement in-memory reminder event index and dedup key logic in src/data/inMemoryContractRepository.ts
- [X] T008 Introduce EmailService contract and payload mapping in src/services/notificationService.ts
- [X] T009 [P] Add UTC eligibility helper functions for threshold and catch-up checks in src/services/contractExpiryReminderService.ts

**Checkpoint**: Foundation complete; user stories can be implemented and tested.

---

## Phase 3: User Story 1 - Timely pre-expiry notification delivery (Priority: P1) 🎯 MVP

**Goal**: Send annual (30-day) and monthly (7-day) reminders when eligible using UTC logic.

**Independent Test**: With non-renewed annual and monthly contracts, one run sends reminders at the correct lead-time event and reports notified counts.

### Tests for User Story 1

- [X] T010 [P] [US1] Add unit tests for annual/monthly UTC eligibility decisions in tests/unit/contractExpiryReminderService.us1.test.ts
- [X] T011 [P] [US1] Add integration test for POST /contracts/expiry-reminders/run success payload in tests/integration/reminderRun.us1.test.ts

### Implementation for User Story 1

- [X] T012 [US1] Implement cadence-specific lead-time policy (30 annual, 7 monthly) in src/services/contractExpiryReminderService.ts
- [X] T013 [US1] Implement catch-up eligibility branch for missed threshold runs in src/services/contractExpiryReminderService.ts
- [X] T014 [US1] Return run counters aligned to API contract fields in src/services/contractExpiryReminderService.ts
- [X] T015 [US1] Align HTTP request field runAtUtc parsing and success response mapping in src/index.ts

**Checkpoint**: US1 should be independently functional and testable.

---

## Phase 4: User Story 2 - Renewal-aware notification suppression (Priority: P1)

**Goal**: Suppress reminders when renewal is effective at run time.

**Independent Test**: A contract with renewal effective timestamp before or equal to run time is skipped and counted as skippedRenewed.

### Tests for User Story 2

- [X] T016 [P] [US2] Add unit tests for renewal-effective suppression behavior in tests/unit/contractExpiryReminderService.us2.test.ts
- [X] T017 [P] [US2] Add integration test verifying skippedRenewedCount and no email dispatch in tests/integration/reminderRun.us2.test.ts

### Implementation for User Story 2

- [X] T018 [US2] Implement renewal-effective-at-runtime suppression branch in src/services/contractExpiryReminderService.ts
- [X] T019 [US2] Ensure repository contract exposes renewal-effective data for evaluation in src/data/inMemoryContractRepository.ts
- [X] T020 [US2] Update seeded in-memory contracts with renewal scenarios for deterministic tests in src/data/inMemoryContractRepository.ts

**Checkpoint**: US1 and US2 should both be independently testable.

---

## Phase 5: User Story 3 - Idempotent runs without duplicate owner messages (Priority: P1)

**Goal**: Enforce permanent one-send-per-reminder-event behavior across repeated and same-day runs.

**Independent Test**: Re-running the same reminder event yields skippedDuplicate increments and no second email send.

### Tests for User Story 3

- [X] T021 [P] [US3] Add unit tests for permanent dedup key behavior in tests/unit/contractExpiryReminderService.us3.test.ts
- [X] T022 [P] [US3] Add integration test for repeated run idempotency and duplicate counters in tests/integration/reminderRun.us3.test.ts

### Implementation for User Story 3

- [X] T023 [US3] Implement permanent dedup check and event write path in src/services/contractExpiryReminderService.ts
- [X] T024 [US3] Persist reminder event identity (contractTermId + leadTimeDays) in repository state in src/data/inMemoryContractRepository.ts
- [X] T025 [US3] Map duplicate and catch-up outcomes to response counters in src/services/contractExpiryReminderService.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, contract alignment, and end-to-end validation.

- [X] T026 [P] Update API contract examples and response field descriptions in specs/001-contract-expiry-notifications/contracts/reminder-run.openapi.yaml
- [X] T027 [P] Update quickstart validation steps to match final endpoint payload and counters in specs/001-contract-expiry-notifications/quickstart.md
- [X] T028 Execute full feature validation run and capture outcomes in specs/001-contract-expiry-notifications/quickstart.md
- [X] T029 Run build and test commands and address regressions in package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice
- **Phase 4 (US2)**: Depends on Phase 2; can proceed after US1 or in parallel once foundation is stable
- **Phase 5 (US3)**: Depends on Phase 2 and requires US1 reminder event shape for final dedup checks
- **Phase 6 (Polish)**: Depends on all story phases

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after foundation
- **US2 (P1)**: No dependency on other stories after foundation
- **US3 (P1)**: Depends on reminder event model introduced in US1 and finalized in foundation

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Implement service logic before route/output adjustments
- Complete story-level validation before moving to final polish

---

## Parallel Opportunities

- **Setup**: T003 can run parallel with T001-T002
- **Foundational**: T007 and T009 can run in parallel after T004-T006 interface direction is clear
- **US1**: T010 and T011 can run in parallel
- **US2**: T016 and T017 can run in parallel
- **US3**: T021 and T022 can run in parallel
- **Polish**: T026 and T027 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Run US1 test tasks in parallel:
Task: "T010 [US1] tests/unit/contractExpiryReminderService.us1.test.ts"
Task: "T011 [US1] tests/integration/reminderRun.us1.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate US1 independently
4. Demo/send for review

### Incremental Delivery

1. Add US2 and validate suppression behavior
2. Add US3 and validate permanent deduplication
3. Finish Polish phase for contract and quickstart alignment

### Team Parallel Strategy

1. One developer drives foundational repository/service contracts
2. One developer focuses on US1 delivery path
3. One developer prepares US2/US3 tests in parallel after foundation

---

## Notes

- [P] tasks are safe for parallel execution when dependencies are satisfied.
- All story tasks include file paths for direct execution.
- Do not introduce an ORM; repository abstraction is mandatory.
- Use EmailService as outbound notification contract for all send operations.
