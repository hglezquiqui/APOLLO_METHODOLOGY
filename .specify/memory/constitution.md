<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] -> I. Approved Stack Boundaries
	- [PRINCIPLE_2_NAME] -> II. Verification and Minimum Coverage Gate
	- [PRINCIPLE_3_NAME] -> III. Date and Time Data Integrity
	- [PRINCIPLE_4_NAME] -> IV. Financial Data Safety and Precision
	- [PRINCIPLE_5_NAME] -> V. Protected Artifacts and Human Approval Boundaries
- Added sections:
	- Stack Constraints
	- Delivery and Review Workflow
- Removed sections:
	- None
- Follow-up TODOs:
	- None
-->

# Apollo Pilot Constitution

## Core Principles

### I. Approved Stack Boundaries
All implementation work MUST stay within the approved stack unless a human explicitly approves a
stack amendment. The default backend stack is Node.js + TypeScript + Express, with relational
storage integrations constrained to approved drivers and schemas already accepted by project
owners. Introducing a new runtime, framework, persistence engine, or orchestration dependency
without approval is forbidden. Rationale: the pilot prioritizes predictability, onboarding speed,
and operational consistency over framework experimentation.

### II. Verification and Minimum Coverage Gate
Every change set MUST include automated tests that validate behavior introduced or modified by the
change. The project minimum is 80% line coverage and 80% branch coverage at the repository level,
and no modified module may reduce its own coverage from the pre-change baseline. Any temporary
exception MUST be explicitly approved by a human and documented in the pull request. Rationale:
the pilot is decision-critical and requires repeatable quality signals before merge.

### III. Date and Time Data Integrity
All persisted timestamps MUST use ISO 8601 with UTC (for example, trailing Z), and internal
comparison logic MUST evaluate in UTC unless a documented business rule defines a specific local
timezone. Owner-facing schedules that depend on locale MUST carry explicit timezone metadata;
implicit server-local timezone behavior is prohibited. Date-only business fields MUST specify the
boundary convention (start-of-day or end-of-day) in code and tests. Rationale: silent timezone
drift is a high-risk failure mode for contract and compliance workflows.

### IV. Financial Data Safety and Precision
Financial values MUST NOT be stored or computed using binary floating-point for canonical records.
Monetary amounts MUST be represented as fixed-precision decimal types or integer minor units,
always paired with an explicit ISO currency code. Any transformation between display values and
stored values MUST be covered by tests, including rounding behavior. Rationale: deterministic
financial math is mandatory for trust and auditability.

### V. Protected Artifacts and Human Approval Boundaries
The agent MUST NOT modify protected artifacts without explicit human approval in the current
conversation. Protected artifacts include this constitution, CI/CD pipelines, deployment
infrastructure definitions, production database migration history, authentication/authorization
rules, secrets handling, and legal/compliance policy documents. The agent MUST also avoid
destructive git operations and irreversible data changes unless explicitly approved. Rationale:
pilot governance requires clear human control over high-impact and security-sensitive changes.

## Stack Constraints

1. TypeScript is the mandatory language for service code unless a written exception is approved.
2. Express is the standard HTTP service framework for pilot APIs.
3. Data contracts MUST be strongly typed and validated at system boundaries.
4. New third-party dependencies MUST be justified by necessity and security-reviewed in PR notes.
5. Runtime and build tooling changes MUST include migration steps and rollback guidance.

## Delivery and Review Workflow

1. All work MUST be traceable to a spec or explicit human request in-session.
2. Pull requests MUST include: scope summary, risk assessment, test evidence, and coverage report.
3. Any change touching date logic or financial logic MUST include at least one edge-case test.
4. Any exception to this constitution MUST include approval evidence and an expiration date.
5. Reviewers MUST block merge when a constitutional rule is violated or unverified.

## Governance

This constitution supersedes conflicting local conventions for the Apollo pilot project.
Amendments require explicit human approval, a documented rationale, and a semantic-version update
under this policy: MAJOR for incompatible governance changes, MINOR for new principles or
materially expanded obligations, and PATCH for clarifications that do not change obligations.
Compliance reviews MUST occur for every pull request and at milestone boundaries. Violations MUST
be remediated before release unless a time-bound exception is approved by project owners.

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
