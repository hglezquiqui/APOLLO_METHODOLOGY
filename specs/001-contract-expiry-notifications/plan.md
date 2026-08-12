# Implementation Plan: Contract Expiry Notifications

**Branch**: `[001-contract-expiry-notifications]` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-contract-expiry-notifications/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implement automatic contract-expiry reminders using the existing Express service-layer pattern,
reading contract data from `ContractRepository`, sending reminders through `EmailService`,
enforcing UTC lead-time logic (30 days annual, 7 days monthly), renewal-effective suppression,
single catch-up behavior after missed runs, and permanent per-term/per-lead-time deduplication.

## Technical Context

**Language/Version**: TypeScript (project tsconfig with Node target)

**Primary Dependencies**: Express, existing service classes in `src/services/`

**Storage**: Existing `ContractRepository` abstraction (no ORM introduced)

**Testing**: TypeScript test runner for unit + integration scenarios (to be selected in tasks)

**Target Platform**: Node.js backend service (HTTP-triggered job endpoint)

**Project Type**: Web service

**Performance Goals**: Reminder run completes within operational batch window; no duplicate sends

**Constraints**: Use existing `ContractRepository`; use existing `EmailService`; no ORM; UTC logic;
permanent deduplication per reminder event; suppress when renewal is effective

**Scale/Scope**: Contract-owner notifications for annual and monthly contracts in one service

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Gate 1 - Stack boundaries: PASS. Plan stays on Node.js + TypeScript + Express.
- Gate 2 - Verification and coverage: PASS. Plan requires unit and integration validation paths.
- Gate 3 - Date/time integrity: PASS. UTC-only eligibility and timestamp handling are explicit.
- Gate 4 - Financial data safety: PASS/Not directly impacted. No monetary computation introduced.
- Gate 5 - Protected artifacts: PASS. No protected artifact modifications required.

Post-Design Re-check (after Phase 1 artifacts): PASS.
- Research, data model, API contract, and quickstart preserve stack boundaries and repository-first access.
- UTC handling, deduplication identity, and renewal-effective suppression remain explicit and testable.

## Project Structure

### Documentation (this feature)

```text
specs/001-contract-expiry-notifications/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── reminder-run.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── inMemoryContractRepository.ts
├── services/
│   ├── contractExpiryReminderService.ts
│   └── notificationService.ts (to align with EmailService contract during implementation)
├── types/
│   └── contract.ts
└── index.ts

tests/
├── unit/
└── integration/
```

**Structure Decision**: Single-project backend structure under `src/` with orchestration in
`src/index.ts`, business logic in `src/services/`, and data-access abstraction in `src/data/`.
Feature implementation extends this pattern without introducing an ORM layer.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
