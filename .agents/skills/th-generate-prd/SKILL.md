---
name: th-generate-prd
description: Generate a reader-facing PRD and separate detailed test-case companion from rough ideas, existing codebases, existing docs, or mixed sources; emphasizes business logic, edge cases, traceability, and draft approval before finalization.
---

# Generate PRD

Use when the user wants a Product Requirements Document, requirements contract, business-logic understanding, or PRD-derived test coverage for a product or application.

## Pipeline placement

Use `/th-generate-prd` before `/th-brainstorm` or planning when:

- the product already exists and business logic must be extracted from code, docs, tests, or mixed sources,
- outsource or production handoff needs explicit requirements, vocabulary, endpoint evidence, and test-oracle traceability,
- UI automation or implementation would otherwise guess Must-priority behavior.

After PRD and companion approval, route to `/th-write-plan` for implementation planning or `/th-generate-automation-tests` for UI scenario drafting. Pass PRD path, companion path, `REQ-###` / `TC-###` / `GAP-###` links, and handoff notes. Do not replace `th-generate-automation-tests`; the companion prepares traceable coverage and the automation skill consumes Approved companion cases when present.

For lightweight scope-only harness work, use `docs/templates/contract.md` instead of a full PRD. See `docs/HARNESS.md` and `docs/product/README.md`.

This skill creates two artifacts inside the active target codebase by default:

1. A PRD using `.agents/templates/prd-template.md`.
2. A separate PRD test-case companion using `.agents/templates/prd-test-companion-template.md`.

The companion file cross-checks coverage and prepares handoff to `th-generate-automation-tests`; it does not replace that skill or executable automation.

## Shared Rules

Follow `AGENTS.md`, `docs/FEATURE_INTAKE.md`, `docs/HARNESS.md`, `docs/TEST_MATRIX.md`, `.agents/rules/context-budget.mdc`, `.agents/rules/tool-availability.mdc`, `.agents/rules/approval-safety.mdc`, and `.agents/rules/terminal-platform-aware.mdc` when present.

Do not copy raw tool logs into generated PRD artifacts. Keep reader-facing output clean and put tool notes, extraction ambiguity, and failed source reads in chat or validation notes.

## Inputs

Classify the source before writing artifacts:

| Input type | Use when | Required behavior |
|---|---|---|
| Rough idea | User describes a new product/feature without durable source docs | Interview for objective, users, flows, business rules, constraints, success metrics, and edge cases. Do not reverse-engineer codebase by default. |
| Existing codebase | User asks to document an existing app/feature | Inspect repo structure enough to identify routes/screens, domain glossary, ADRs, data models, API contracts, permissions, validations, state transitions, existing tests, and current behavior. |
| Existing docs | User provides specs, tickets, screenshots, Sheets exports, or user flows | Synthesize source material, preserve source traceability, and flag contradictions. |
| Mixed sources | User provides any combination of idea, code, docs, tests, screenshots, or prior chat | Separate verified facts, assumptions, conflicts, and decisions needed. |

Observed code behavior is a verified implementation fact, not automatically intended product truth. If code, docs, and user intent conflict, use the source conflict rubric below and record a decision needed.

## Minimum Evidence Checklist

Collect enough evidence to support the PRD source summary before drafting. Stop once the checklist for the classified input type is satisfied; do not perform exhaustive repo exploration.

| Input type | Minimum evidence before drafting |
|---|---|
| Rough idea | User-stated objective, target users, primary flows, core business rules, constraints, success metrics, and explicit unknowns or assumptions. |
| Existing codebase | Entry-point docs or README when present; top-level routes/screens/commands/jobs; core data models or schemas; permission/validation/state-transition evidence; existing tests or fixtures when present. |
| Existing docs | Source list with document paths or provided artifact names; extracted requirements/rules; assumptions; contradictions; missing success metrics or release criteria. |
| Mixed sources | Evidence grouped by source type; verified facts separated from assumptions; explicit conflicts between docs, code, tests, screenshots, and user intent. |

If evidence is unavailable because a read/search/write is blocked, continue with the write-blocked fallback protocol instead of pretending the evidence was inspected.

## Source Conflict Rubric

When sources disagree, classify the conflict before writing requirements:

| Conflict type | Treatment in PRD |
|---|---|
| User intent vs observed code | Treat user intent as desired product direction and code as current implementation fact; mark the requirement/rule as needing a decision if behavior changes are implied. |
| Docs vs observed runtime/code | Treat runtime/code as current behavior and docs as intended or stale policy until confirmed; record a source conflict and add a decision needed. |
| Tests vs code behavior | Treat tests as expected behavior only when they are current and passing or clearly authoritative; otherwise record the mismatch as a coverage or maintenance gap. |
| Multiple docs disagree | Prefer the newest approved artifact when status/date is available; otherwise keep both claims and ask for ownership/approval. |
| Missing source for critical business logic | Do not invent the rule. Add a blocking question when it affects permissions, money, state, compliance, data lifecycle, integrations, failures, release criteria, or success metrics. |

## Write-Blocked Fallback Protocol

If artifact creation or updates are blocked by permissions, credential-path guards, sandbox restrictions, missing directories, or repository policy:

1. Do not bypass the guard, disable hooks, write outside the target repo without approval, or silently drop the artifact.
2. Report the intended PRD path and companion path, the blocker message, and the fallback path or delivery method used.
3. Prefer the nearest safe repo-local convention that avoids the blocked path, such as an existing non-sensitive docs/specs/product directory.
4. If no safe write path is available, return the full PRD and companion content in chat as ready-to-paste drafts, preserving `Status: Draft`.
5. Include the blocked write as a coverage or handoff note only when it affects reviewability or downstream automation.
6. Ask for approval before retrying writes that require broader filesystem permissions or policy changes.

## Uncertainty Severity Classification

Classify missing or conflicting product knowledge before deciding whether to ask the user:

| Severity | Use when | Required handling |
|---|---|---|
| Blocking | The answer affects critical business behavior, permissions, state transitions, data lifecycle, compliance/privacy/security, external integrations, failure handling, release criteria, success metrics, or test correctness. | Ask the user in a batched question set, or keep artifacts Draft with linked blocking questions. Do not mark Approved unless the user answers or explicitly accepts the risk. |
| Draft risk | The workflow can draft a useful PRD with a source-backed assumption, but tests or automation would be provisional until the decision is confirmed. | Record the assumption, link affected requirements/tests to a question or gap ID, and mark affected companion tests `Provisional` or `Gap`. |
| Non-blocking | The answer improves wording, future polish, ownership, or non-critical detail without changing business behavior or test oracles. | Record as an open question or assumption without interrupting drafting. |

If a `Must` business rule has low confidence, classify it as `Blocking` or `Draft risk`; never silently promote it to a final requirement.

## Blocking Questions Gate

Ask blocking questions before drafting or finalizing when missing information affects:

- permissions, ownership, or roles,
- payments, billing, quotas, eligibility, or calculations,
- irreversible actions or data loss,
- state transitions and lifecycle rules,
- compliance, privacy, security, or retention,
- external integrations or failure handling,
- release criteria or success metrics,
- test oracle correctness or automation readiness.

Batch questions in one turn where practical. Group questions by decision area:

- state machine and lifecycle,
- permissions and ownership,
- contract/export/test oracle,
- external integrations and fallback behavior,
- UI/user-facing copy and diagnostics,
- metrics, SLOs, and release criteria.

Each blocking question should include the decision needed, a recommended default when justified by source evidence or safety, the tradeoff, and the impact on requirements or test cases. For non-blocking gaps, write explicit assumptions and open questions in the draft instead of prompting immediately.

Do not pretend a one-shot prompt is enough for complex existing products. If critical business logic remains unclear after bounded evidence collection, ask a compact batched question set before final approval. Minimize user prompting by reusing resolved decisions, applying safe source-backed defaults, grouping related questions, and downgrading non-critical uncertainty to Draft risks or open questions instead of interrupting the user.

## Evidence Confidence and Decision Reuse

Assign confidence to major business rules and product decisions:

| Confidence | Meaning |
|---|---|
| High | Code, docs, tests, and/or user intent agree; or an approved/resolved product decision exists. |
| Medium | Implementation evidence exists, but product intent or test oracle details are not fully explicit. |
| Low | The rule is inferred from weak evidence such as UI copy, comments, lessons, partial schemas, or analogous behavior. |

When updating an existing PRD, read its resolved decisions before asking questions. Reuse decisions that still match current evidence. If a resolved decision conflicts with new code/docs/tests/user intent, record a source conflict and ask only when the conflict is `Blocking`; otherwise downgrade confidence or mark a Draft risk.

The PRD should make confidence visible for major rules/decisions, either in business-rule tables, resolved-decision tables, or decision notes.

## Provisional Tests and Update-after-Answer Protocol

The test companion may use these statuses:

- `Draft`: written but not approved as final coverage.
- `Ready`: enough source evidence and product decisions exist for automation or manual verification.
- `Provisional`: useful draft test, but assertions depend on unresolved Draft risk or implementation-field evidence.
- `Blocked`: cannot be automated or considered valid until a linked blocking question is answered.
- `Gap`: missing test, missing fixture, or missing decision prevents coverage.

Tests depending on unanswered blocking questions must reference the question ID. Coverage gaps should distinguish missing decisions, missing fixtures/tests, and provisional automation risk.

When the user answers blocking questions, update all affected artifacts without waiting for a separate request:

1. Source summary and source conflicts.
2. Resolved product decisions.
3. Business rules, confidence, and state transitions.
4. Functional requirements and acceptance criteria.
5. Edge cases and NFRs.
6. Requirement traceability matrix.
7. Test companion cases, statuses, question/gap links, and coverage counts.
8. Handoff notes for `th-generate-automation-tests`.
9. Change log and approval status.

If unresolved blocking questions remain, keep artifacts `Status: Draft` unless the user explicitly accepts the risk.

## Source Research Checklist

For existing apps or mixed sources, search only as much as needed to understand product behavior. Start with entry-point docs and top-level route/model/test searches; stop when there is enough evidence to draft the source summary, blocking questions, and traceability assumptions.

- domain glossary, terminology, and product vocabulary,
- ADRs or decision records that constrain behavior,
- routes, screens, commands, jobs, or public entry points,
- data models, entities, schemas, API contracts, and external integrations,
- permissions, ownership checks, validation rules, error handling, and state transitions,
- existing tests, fixtures, UAT reports, and automation reports,
- README or workflow docs that define user-facing behavior.

Use the project's vocabulary in the PRD. Avoid inventing new terms when established glossary terms exist.

## Conflict Ledger for Existing and Mixed Sources

For `Existing codebase` and `Mixed sources` inputs, include a compact source-conflict ledger when more than one evidence type is inspected. Compare user intent, current code/runtime behavior, docs/PRDs/ADRs/lessons, tests/fixtures/automation reports, and API/schema contracts.

Ledger rows should include the competing claims, source paths or artifact names, conflict severity, recommended default when justified, and affected requirements, rules, questions, gaps, or tests. Cover at least code-vs-doc, comment-vs-code, test-vs-code, multiple-doc, duplicate service/endpoint contracts for the same user action, and missing-source conflicts.

If no material conflict is found, state `No material conflicts found` with the inspected evidence scope. If a conflict affects permissions, lifecycle, data lifecycle, exports, diagnostics, integrations, release criteria, or test oracle correctness, classify it as `Blocking` unless source evidence safely downgrades it or the user explicitly accepts the risk.

For route-driven products, treat documented routes, navigation entries, or permission mappings that lead to empty, placeholder, hidden, or unimplemented screens as source conflicts. Record the route, documented claim, observed implementation state, affected persona/permission, and whether the default should be blocking, Draft risk, or accepted non-goal.

## Vocabulary, Status, and Contract Extraction

For stateful or API-driven products, extract business-critical vocabulary before finalizing business rules or test cases. Include status enums, numeric status meanings, route/mode/readiness literals, approval states, lifecycle states, public/private or active/inactive flags, export/readiness states, roles, permissions, and error/status codes that define user-visible behavior.

Cross-check the same concept across schemas, service logic, UI copy, docs, and tests when those sources exist. Record whether each term is a product contract, implementation fact, assumption, or decision needed, with source evidence and confidence.

If a numeric status or enum literal lacks authoritative meaning, do not treat it as obvious. Link the affected rule or test to a question or gap and mark it `Blocked`, `Provisional`, or `Gap` according to severity. If no numeric statuses are found after targeted inspection, explicitly state `No numeric statuses found in inspected sources` so reviewers know the check was performed.

Normalize numeric status values only when an authoritative source maps value to meaning. Cross-check backend schemas, frontend labels, service filters, fixtures, docs, and tests for the same value; if `0/1`, `1/2`, string enums, or UI labels disagree, record a source conflict and require a decision before marking related tests `Ready`.

For products with separate frontend/backend state vocabularies, include a vocabulary diff check that compares implementation literals against user-facing labels and product-contract terms. Treat unmapped labels, hidden states, deprecated statuses, and route/mode/readiness drift as Draft risks or blocking questions when they affect behavior or test oracles.

## No-Test-Baseline and Strict Coverage Protocol

If no relevant tests, fixtures, UAT reports, automation reports, or approved test oracles are found, do not overuse `Ready` in the companion. Default affected tests to `Draft`, `Provisional`, or `Gap` unless source evidence and product decisions are sufficient for a stable oracle.

Automatable tests with unknown fixture setup, backend state, API contract, or data seed requirements should be marked `Provisional` and linked to a gap. Missing tests for Must-priority behavior should create explicit coverage gaps rather than implied coverage.

Every Must-priority requirement and critical business rule must have at least one direct `TC-###` or explicit `GAP-###`. Companion traceability rows must label coverage as `Direct`, `Indirect`, or `Gap`; indirect coverage never satisfies Must coverage by itself. If a test only indirectly covers the requirement, mark coverage as `Indirect`, explain the dependency, and identify the missing direct coverage or explicit gap.

## Endpoint-Backed Traceability

For frontend, CMS, backend, and integration-heavy products, trace API-driven requirements and tests to observable service or endpoint contracts where available. Include endpoint path, method, service function, schema, or contract reference in the companion when it clarifies the test oracle.

For API-driven Must requirements, require an evidence tuple in PRD or companion traceability when available: endpoint path/method, route or permission guard, service/function, schema or response shape, status/error codes, and source reference. If any tuple element is unavailable, record the missing part as an assumption, Draft risk, or explicit `GAP-###` according to severity.

Route declarations, navigation entries, or permission maps alone are not sufficient endpoint evidence. A route-backed Must requirement needs behavior, handler, guard, or service evidence; otherwise create a route-implementation gap instead of treating the requirement as fully covered.

If the API contract is missing, external, version-unclear, or only implied by frontend code, record it as an assumption or Draft risk. Escalate to a blocking question only when it affects test correctness, release behavior, permissions, data lifecycle, or failure handling.

For user-visible endpoint error paths, include a negative-path test or explicit gap. For purely local UI behavior where no endpoint applies, mark the endpoint/contract reference as `N/A` instead of inventing one.

## Diagnostics and Sanitization

When a product exposes warnings, diagnostics, provider responses, fallback reasons, traces, logs, internal statuses, or detailed errors, distinguish user-facing behavior from internal implementation detail. Record which surfaces may show diagnostics, which details must be hidden or transformed, and what sanitized message/status becomes the product contract.

If diagnostics visibility differs by state, role, environment, route, export mode, or feature flag, capture those conditions as business rules and tests. If source evidence does not prove whether internal details may be exposed, create a Draft risk or blocking question when it affects privacy, security, compliance, supportability, or test oracle correctness.

Treat silent catches, swallowed errors, generic fallback messages, unredacted logging, and provider/internal payload forwarding as diagnostics evidence. Record whether the product contract requires suppression, redaction, user-visible recovery guidance, support telemetry, or an explicit gap.

## PRD Drafting Requirements

The PRD must include:

- source summary with verified facts, assumptions, source conflicts, blocking questions, Draft risks, and non-blocking open questions,
- source-conflict ledger for existing-codebase or mixed-source inputs, including no-material-conflict notes when applicable,
- resolved product decisions with decision ID, date, source/approver, confidence, reuse status, and impacted requirements/rules/tests,
- vocabulary/status/state tables for business-critical enums, numeric statuses, roles, permissions, route/mode/readiness literals, and contract terms when applicable,
- problem statement and business impact,
- users/personas and success metrics,
- in-scope and out-of-scope boundaries,
- happy paths, alternate paths, and failure paths,
- business rules with source evidence and confidence, plus state transitions, calculations, limits, permissions, validations, diagnostics/sanitization rules, endpoint/service contracts when applicable, and data lifecycle,
- functional requirements with stable IDs such as `REQ-001`,
- non-functional requirements with measurable thresholds where applicable,
- extensive numbered user stories,
- Given/When/Then acceptance criteria,
- edge cases and risk scenarios,
- module and testability sketch,
- requirement traceability matrix,
- severity-classified open questions and decisions needed with recommended defaults, tradeoffs, impact, affected requirements/tests, owner, and status,
- change log.

Requirements should describe one behavior, have one interpretation, and be testable. Prefer measurable statements over vague terms. If a term like "fast", "simple", or "secure" appears, define the threshold or verification method.

## Module and Testability Sketch

Inspired by `to-prd`, sketch major modules or interfaces only when it improves testability or clarifies constraints.

A useful module sketch identifies deep modules: components that encapsulate meaningful complexity behind a stable, testable interface. Use this to guide testing decisions, not to create a file-level implementation plan.

Do not over-prescribe implementation details. PRDs should specify what and why. Include implementation decisions only when they are already decided, source-backed, or necessary to preserve business intent.

## Test-Case Companion Requirements

Create a separate companion file with:

- source PRD path and status,
- coverage summary,
- detailed test cases with stable IDs such as `TC-001`,
- positive, negative, edge, permission/security, and NFR test categories,
- preconditions, steps, expected results, priority, status, verification method, endpoint/service contract reference where applicable, and question/gap links,
- test statuses from `Draft`, `Ready`, `Provisional`, `Blocked`, and `Gap`, with no-test-baseline cases avoiding unsupported `Ready` status,
- bidirectional traceability from requirements to tests and tests back to requirements, including question/gap links and required `Direct` / `Indirect` / `Gap` coverage labels,
- coverage gaps that distinguish missing decisions, missing fixtures/tests, missing oracle, missing backend/API contract, missing direct Must coverage, indirect-only Must coverage, and provisional automation risk,
- handoff notes for `th-generate-automation-tests` that flag provisional or blocked automation candidates and missing fixture/API setup.

Every test case must trace to a requirement, business rule, acceptance criterion, edge case, NFR, question, or gap. Every Must-priority requirement needs at least one direct test case or an explicit coverage gap; indirect coverage must be marked as `Indirect` with a dependency note rather than silently satisfying Must coverage.

Test decisions should prefer external behavior over implementation details. The companion may recommend isolated tests for deep modules, but it should describe observable behavior at the module boundary.

## Traceability Rules

Use stable IDs and never rely on row order as identity.

Minimum ID families:

- `BR-###` for business rules,
- `REQ-###` for requirements,
- `US-###` for user stories,
- `AC-###` for acceptance criteria,
- `EDGE-###` for edge cases,
- `NFR-###` for non-functional requirements,
- `TC-###` for test cases,
- `GAP-###` for coverage gaps.

Trace forward from requirement to acceptance criteria and tests. Trace backward from each test case to the requirement/rule/edge case it verifies. For API-driven behavior, include endpoint/service/schema references where observable, or mark the contract reference as `N/A` for purely local behavior. Flag orphan tests, untested requirements, indirect-only coverage, and Must requirements without a direct `TC-###` or explicit `GAP-###`.

## Artifact Paths

Default paths when the target repo has no stronger convention:

```text
docs/product/<topic>-prd.md
docs/product/<topic>-prd-test-companion.md
```

If the repo already has a requirements/spec/test-results convention, follow that convention and report the chosen paths before writing.

## Draft Approval Gate

Generated PRD artifacts start as `Status: Draft`.

Before finalizing:

1. Present the PRD path, companion path, source summary, blocking questions, coverage gaps, and decision needed items.
2. Ask the user for approval or changes.
3. Do not mark artifacts `Approved` while blocking questions remain unresolved unless the user explicitly accepts the risk.
4. When approved, update status and change log.

## Change Impact Rule

When updating an existing PRD:

- identify changed requirements, rules, acceptance criteria, and test cases,
- update traceability and coverage gaps,
- note impacted downstream artifacts,
- keep the change log current,
- ask before finalizing if the change alters business logic, permissions, data lifecycle, or release criteria.

## Handoff to th-generate-automation-tests

Use `th-generate-automation-tests` after PRD approval when browser/UI automation, e2e scenarios, or executable test artifacts are needed.

Pass the PRD path, companion path, candidate flows, source IDs, coverage gaps, and any `TC-###` / `GAP-###` / `Q-###` links that affect automation readiness. Tell the automation skill to treat companion cases marked `Ready` or approved for automation as primary oracles and to preserve traceability back to `REQ-###` / `BR-###`. Do not auto-run automation generation unless the user requested it or the workflow explicitly routes there.

## Output Summary

After drafting or updating artifacts, report:

- PRD path,
- test companion path,
- input classification,
- unresolved blocking questions,
- coverage gaps,
- approval status,
- recommended next action.
