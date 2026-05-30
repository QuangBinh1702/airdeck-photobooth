---
name: th-generate-automation-tests
description: "Draft or update structured UI automation test-case documents with a Draft -> Approved gate. Use th-execute-automation-tests for approved browser execution and reports."
---

# Generate Automation Tests

Draft or update structured UI automation test-case documents. Keep this skill focused on discovery, test design, approval, and orchestration.

**Terminal:** Use syntax for user's OS per `.agents/rules/terminal-platform-aware.mdc`.

**RTK routing:** If `.agents/rules/rtk-terminal-optimization.mdc` exists and RTK is installed, classify local discovery commands per that rule before execution. Repository search and git history are usually RTK candidates; required Playwright MCP evidence, screenshots, and exact validation output are raw/evidence paths. Rerun raw whenever RTK fails or output is insufficient.

**Shared rules:** Follow `.agents/rules/automation-evidence.mdc`, `.agents/rules/tool-availability.mdc`, `.agents/rules/context-budget.mdc`, `.agents/rules/approval-safety.mdc`, and `.agents/rules/effort-levels.mdc`.

**UI/UX:** When drafting visual, responsive, accessibility, or interaction test cases, follow `.agents/rules/ui-ux-design-intelligence.mdc`.

**Execution handoff:** When test cases are Approved and browser execution/reporting is requested, use `th-execute-automation-tests` if available. If that skill is unavailable, use `th-using-playwright-mcp` plus `.agents/rules/automation-evidence.mdc`; if Playwright MCP is unavailable, report a blocker.

<HARD-GATE>
Evidence, screenshot, highlight, screenshot-path, and teardown rules live in `.agents/rules/automation-evidence.mdc`. Any execution handoff must follow that rule. Do not duplicate or weaken those rules in this skill.
</HARD-GATE>

## What this skill does

- Discovers whether relevant test-case docs already exist.
- Drafts or updates Markdown test-case documents under `docs/test_cases/`.
- Uses attached resources or codebase discovery to produce concrete, non-duplicate scenarios.
- Applies a Draft -> Approved gate, with auto-approval only when the user's prompt explicitly allows it.
- Hands Approved execution/reporting to `th-execute-automation-tests`.

This is not CI test-code generation (`*.spec.ts`, Jest, pytest). Code-based tests are an implementation task.

## When to use

Use this skill when the user wants:

- Structured UI test scenarios.
- Test-case Markdown docs with acceptance criteria and expected results.
- A planned browser verification suite with approval before execution.
- Brainstorming routes a testing/verification request here.

Do not use this skill when:

- The user wants ad-hoc browser interaction -> use `th-using-playwright-mcp`.
- The user wants to run an already Approved test-case doc -> use `th-execute-automation-tests`.
- The user wants code-based automated tests -> use the normal implementation workflow.
- The user wants design exploration -> use `th-brainstorming`.

## Key terms

- **TC**: test case; one scenario with clear preconditions, steps, expected result, and final action.
- **POSITIVE**: valid input / happy path / expected success.
- **NEGATIVE**: invalid input / forbidden action / controlled failure.
- **Draft**: test-case doc is not approved for execution yet.
- **Approved**: user explicitly approved the doc, or prompt allowed auto-approval.
- **Final action**: teardown or reset action after evidence; required unless explicitly N/A.
- **Traceability**: each TC should map to a requirement, bug, design, route, component, visible behavior, or PRD companion `TC-###` / `REQ-###` when present.

## Phase router

Before drafting anything, answer these questions in order:

1. **Existing test-case doc?**
   - Found Approved doc + user wants run/re-run -> hand off to `th-execute-automation-tests`.
   - Found Draft doc + no auto-approve -> present for review.
   - Found Draft doc + prompt allows auto-approve -> set Approved, then hand off if run requested.
   - Found doc + source changed or scope changed -> update the doc, then approval flow.
   - Not found -> continue to PRD companion discovery.

1b. **Approved PRD test companion?**
   - Search `docs/product/` for `*-prd-test-companion.md` and the matching `*-prd.md` for the topic, feature, route, or screen ID.
   - Found Approved companion + Approved PRD -> use PRD-companion-first drafting (`Phase 2C`) unless the user explicitly requests codebase-only discovery.
   - Found Draft companion or unresolved blocking questions -> present PRD gaps/blockers; do not mark Must-priority automation cases Approved from codebase guesses alone.
   - Found companion with `Provisional`, `Blocked`, or `Gap` statuses -> carry those links forward; do not silently upgrade them to executable Approved automation without user acceptance or PRD update.
   - Not found -> continue to source confirmation.

2. **Source for drafting?**
   - Approved PRD test companion + PRD -> PRD-companion-first draft.
   - Attached specs/requirements/design/bug docs -> resource-based draft.
   - Prompt says `from codebase`, `based on code`, or equivalent -> codebase-based draft.
   - No source and no explicit codebase permission -> ask one concise A/B question:
     - A. I read the codebase and draft from implementation.
     - B. You attach requirements/specs first or run `/th-generate-prd` first.

3. **Approval mode?**
   - Prompt says `no approval needed`, `auto-run`, `skip approval`, `không cần approve`, or equivalent -> set Status: Approved after draft self-check.
   - Otherwise keep Status: Draft and ask for review.

4. **Execution requested?**
   - If Approved and user asked to run/verify/auto-run -> hand off to `th-execute-automation-tests`.
   - If Draft or not approved -> stop after presenting the draft.

## Phase 0: Existing artifact discovery

1. Search `docs/test_cases/` for matching feature, screen ID, route, bug ID, or topic.
2. Search `docs/product/` for matching `*-prd.md` and `*-prd-test-companion.md` when the topic may already have PRD coverage.
3. If a matching test-case doc exists, read only that doc and directly relevant report metadata.
4. Search `docs/test_results/` for a matching report when needed.
5. Decide whether to:
   - present existing Draft for review,
   - update stale/outdated TCs,
   - draft from an Approved PRD companion,
   - approve when auto-approval is explicitly allowed,
   - or hand off to `th-execute-automation-tests`.

Do not ask for resources when an existing relevant test-case doc or Approved PRD companion already determines the path.

## Phase 1: Source confirmation

Use the least expensive reliable source:

- PRD-companion-first: Approved `docs/product/<topic>-prd-test-companion.md` plus its source PRD.
- Resource-based: attached requirements, design docs, UAT bugs, PRs, issue descriptions.
- Codebase-based: routes, components, labels, validators, API calls, existing tests.
- Hybrid: PRD companion or resources first, codebase only to validate exact UI labels/routes and fill gaps explicitly marked in the companion.

If source is missing and the prompt does not authorize codebase discovery, ask one A/B question and wait.

## Phase 2C: PRD companion-based draft

Use when an Approved PRD and companion exist for the topic.

1. Read the PRD path, companion path, coverage summary, detailed test cases, Must Coverage Gate, coverage gaps, and handoff notes.
2. Prefer companion cases marked `Ready` or explicitly approved for automation as primary oracles.
3. Map each automation TC back to companion `TC-###`, `REQ-###`, `BR-###`, `AC-###`, and question/gap links when present.
4. Preserve evidence tuples, endpoint/service references, preconditions, expected results, and negative/permission coverage from the companion; use codebase reads only to resolve UI labels, routes, selectors, or fixture setup called out as missing in `GAP-###`.
5. Do not auto-approve automation cases that depend on companion tests still marked `Provisional`, `Blocked`, or `Gap` unless the user explicitly accepts Draft risk.
6. Include a coverage note listing companion cases not yet converted to UI automation and why.
7. When the companion's handoff notes identify candidate UI/E2E flows, prioritize those before inventing new scenarios.

## Phase 2A: Resource-based draft

1. Read the attached or referenced resources.
2. Extract testable behaviors, acceptance criteria, roles, data conditions, and visible UI copy.
3. Create TCs that cover all testable behaviors with no duplicate scenarios.
4. Preserve literal UI labels/messages as written; write test narrative in English unless the user requested another authoring language.
5. Add a resource-to-TC mapping or coverage notes when useful.

## Phase 2B: Codebase-based draft

Use runtime-aware discovery per `.agents/rules/tool-availability.mdc`:

- Prefer repository tools such as tilth/repomix when available.
- Fallback to `rg`, targeted file reads, route definitions, components, validators, and existing tests.
- Use PostgreSQL MCP only when data preconditions require DB knowledge and approval rules allow it.

Draft steps with real visible text, routes, controls, and expected outcomes. Do not use placeholder actions such as "click the button" when the accessible name or visible label can be discovered.

## Test-case quality rules

Every test-case document must:

- Use `.agents/templates/test-case-template.md`.
- Start as `Status: Draft` unless auto-approval is explicitly allowed.
- Use canonical scenario labels `POSITIVE` and `NEGATIVE`.
- Include at least one POSITIVE and one NEGATIVE TC unless coverage notes explain why one type is not applicable.
- Include visual/responsive/accessibility TCs only when they are in scope; tie them to concrete expectations such as viewport behavior, text fit, focus visibility, hover/click states, contrast, or reduced motion.
- Give each TC a unique title and one distinct behavior.
- Include concrete preconditions, test data, expected result, postconditions, and final action.
- Include no secrets; use environment variable names or placeholders.
- Keep execution evidence out of the test-case doc; evidence belongs in the report written by `th-execute-automation-tests`.
- Track blockers in the Problems & solutions table instead of silently omitting cases.

## Phase 3: Review and approval

After drafting or updating:

1. Run a self-check against the planning checklist in the template.
2. Save the doc to `docs/test_cases/YYYY-MM-DD-NNNNNN-<topic>-test-case.md`.
3. Present a concise summary: scope, TC count, key POSITIVE/NEGATIVE coverage, blockers, and file path.
4. If auto-approval was not explicitly requested, ask the user to review and approve.
5. When the user approves, update the same file to `Status: Approved`.

Approval phrases include `approved`, `ok`, `looks good`, `đồng ý`, or equivalent. Do not treat unrelated clarification answers as approval.

## Phase 4: Execution handoff

When execution is requested and the test-case doc is Approved:

1. Invoke or hand off to `th-execute-automation-tests`.
2. Pass the approved test-case path, run scope, topic, target URL if known, and any approval decisions.
3. Do not duplicate browser execution/report-writing logic here.

If execution finds product bugs:

- The execution report records `FAIL`, evidence, root cause/hypothesis, and follow-up.
- Do not auto-fix code by default.
- If the user explicitly requested auto-fix, hand off to the appropriate implementation or UAT fix workflow after the report exists.

## File naming

### Test-case documents

- Path: `docs/test_cases/YYYY-MM-DD-NNNNNN-<topic>-test-case.md`
- `YYYY-MM-DD`: local date.
- `NNNNNN`: 6-digit per-day sequence. List existing `docs/test_cases/YYYY-MM-DD-*`, parse the numeric segment, and use max + 1. If none exist, use `000001`.

### Reports

Reports are written by `th-execute-automation-tests` under `docs/test_results/`. Use the same date/sequence as the test-case doc for the first report when practical; otherwise increment for distinct reruns.

## Existing report classification

When a matching report exists, use it only to decide whether drafting/updating or execution is needed:

- PASS + source unchanged -> no draft update required.
- FAIL due to known product bug + source unchanged -> do not rerun just to rediscover the same bug.
- FAIL due to infra/tooling/stale steps -> update TC or hand off for rerun.
- SKIP with blocker still valid -> keep skipped; document blocker.
- Source changed after report -> mark relevant TCs as potentially outdated and update before rerun.

Keep classification concise; detailed execution belongs in `th-execute-automation-tests`.

## Templates

Read templates only when needed:

- Test case document: `.agents/templates/test-case-template.md`.
- Test report: `.agents/templates/test-report-template.md` (used by `th-execute-automation-tests`).

## Completion checklist

Before marking this skill complete:

- Relevant existing docs were searched before creating new ones.
- PRD companion discovery in `docs/product/` was attempted when the topic may have PRD coverage.
- Source path was clear: PRD companion, resources, codebase, or user decision.
- Test-case doc exists under `docs/test_cases/`.
- Status is Draft or Approved correctly.
- TC coverage is distinct and traceable.
- POSITIVE/NEGATIVE labels are used.
- Final action is defined for every TC or explicitly N/A.
- Problems & solutions table lists blockers or states none.
- If execution was requested, handoff to `th-execute-automation-tests` was made or a blocker was reported.

## Relationship to other skills and rules

| Skill/rule                              | Relationship                                                      |
| --------------------------------------- | ----------------------------------------------------------------- |
| `th-generate-prd`                       | Upstream source for Approved PRD + companion and test-oracle handoff. |
| `th-brainstorming`                      | Routes structured UI test generation here.                        |
| `th-execute-automation-tests`           | Executes Approved test-case docs and writes reports.              |
| `th-using-playwright-mcp`               | Ad-hoc browser control and fallback execution support.            |
| `.agents/rules/automation-evidence.mdc` | Source of truth for screenshots, highlights, paths, and teardown. |
| `th-using-postgresql-mcp`               | Optional data/precondition inspection when DB access is needed.   |
| `th-fix-uat-bugs`                       | Fix workflow for UAT bugs; not default test execution.            |
