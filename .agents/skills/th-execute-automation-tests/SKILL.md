---
name: th-execute-automation-tests
description: "Execute Approved UI automation test-case documents with Playwright MCP and write Markdown reports under docs/test_results/. Use when test cases already exist and the user wants to run or re-run them."
---

# Execute Automation Tests

Execute Approved UI automation test cases using Playwright MCP and write a test report.

**Terminal:** Use syntax for user's OS per `.agents/rules/terminal-platform-aware.mdc`.

**Shared rules:** Follow `.agents/rules/automation-evidence.mdc`, `.agents/rules/tool-availability.mdc`, `.agents/rules/context-budget.mdc`, and `.agents/rules/approval-safety.mdc`.

**UI/UX:** For visual, responsive, accessibility, or interaction test execution, follow `.agents/rules/ui-ux-design-intelligence.mdc`.

## When to use

Use this skill when:

- An Approved test-case document exists under `docs/test_cases/`.
- The user asks to run, execute, re-run, verify, or produce a report for existing UI test cases.
- `th-generate-automation-tests` has finished drafting/approval and needs to hand off to execution.

Do not use this skill to design new test scenarios from scratch. Use `th-generate-automation-tests` for drafting or updating test-case docs.

## Inputs

- Approved test-case doc path, or enough topic/screen/feature detail to find one in `docs/test_cases/`.
- Target URL and app/auth preconditions from the test-case doc or user.
- Playwright MCP tools must be available. If not, report a blocker.

## Process

1. **Find and validate test-case doc**
   - Search `docs/test_cases/` for the requested topic if no path is provided.
   - Read only the selected test-case doc and directly needed templates/rules.
   - Confirm `Status: Approved`, unless the user's original request explicitly says `no approval needed`, `auto-run`, or equivalent and the generation workflow already permits auto-approval.

2. **Determine run scope**
   - Full suite by default.
   - Partial run only when the user names TC IDs or an existing report classifies eligible re-runs.
   - Do not skip a TC because a prior TC failed; manually fulfill preconditions when possible.

3. **Preflight**
   - Read `th-using-playwright-mcp/SKILL.md` for project/browser conventions.
   - Confirm target URL, app availability, auth state, and required test data.
   - Confirm test isolation assumptions: role/session, safe fixture data, reusable records, parallel-run collisions, and any cleanup/final state required by the Approved TC.
   - For credentials, follow `.agents/rules/approval-safety.mdc`; never paste secrets into reports.

4. **Execute cases**
   - Take a fresh `browser_snapshot` before each TC.
   - Follow the test-case steps using refs from the latest snapshot.
   - Capture evidence per `.agents/rules/automation-evidence.mdc`.
   - Prefer user-visible state and web-first, condition-based evidence; use network/console/browser diagnostics only when the TC requires them or UI evidence is insufficient.
   - Apply the specialized protocols below only when the Approved TC includes the matching behavior; otherwise keep the normal UI-only flow unchanged.
   - Execute the documented Final action/teardown before moving to the next TC.
   - Record result as `PASS`, `FAIL`, `SKIP`, or `BLOCKED` with reason. Use harness-backed evidence only when the TC or user explicitly allows non-browser proof.

### Result semantics

- `PASS`: browser evidence proves the documented expected result, including visible state, URL, file/control state, or relevant network/console evidence when required by the TC.
- `FAIL`: the app reaches an observable wrong state, error, missing result, forbidden access leak, unexpected console/network failure, or timeout after the required observable source was available.
- `SKIP`: a required precondition, safe test datum, credential, file, account role, or tool is unavailable and the app behavior was not exercised.
- `BLOCKED`: execution cannot continue because the app, target URL, Playwright MCP, auth setup, worker/server dependency, or approved evidence source is unavailable.
- `HARNESS_PASS` or equivalent harness-backed wording may appear in the report only when an Approved TC, existing report class, or user instruction permits non-browser harness evidence. Do not fabricate browser `PASS` for worker, API, DB, or export states that the browser did not prove.

### Specialized execution protocols

Use these as additive evidence rules for matching TCs. If a protocol needs tools or data outside the approved scope, document `SKIP` or `BLOCKED` instead of guessing.

- **Async/background/worker/LLM lifecycle**
  - Identify the observable job key before waiting: analysis ID, run ID, upload row, transcript title, URL, visible status, or network request.
  - Identify the expected terminal criteria and wait budget before judging the case: use the Approved TC first; if absent, use visible UI copy, existing report precedent, or app/API reference discovered during preflight. Do not invent a short timeout for LLM/worker jobs.
  - Capture the minimum state trail: created/queued or initial state, `processing` or progress state when visible, and terminal `done`/results or timeout/failure state.
  - Prefer condition-based waits over fixed sleeps: expected text, fresh snapshots, relevant network requests, console messages, stream/status endpoints visible in the browser session, or an approved harness/API source when explicitly in scope.
  - For long-running LLM/worker flows such as audio transcript upload -> processing -> done/results, record the last observed state, elapsed wait, and expected timeout source if the terminal state is not reached. Mark `FAIL` only when the expected source was available and contradicted the TC or the documented wait budget expired; otherwise mark `BLOCKED` or `SKIP` with the missing dependency.

- **Upload/import validation**
  - Verify the selected file name, accepted/rejected UI state, validation message, and upload/network response when available.
  - For invalid type, size, missing file, or duplicate import cases, highlight the relevant error field/message in screenshots.
  - Do not read or upload user-private files unless the test-case doc supplies safe fixtures or the user explicitly approves the file.

- **Export/download/streamed artifacts**
  - Capture the export trigger, visible success/error state, and relevant network request/status.
  - If the runtime exposes downloaded files or generated artifact metadata, verify the expected file type/name/content marker that the TC specifies.
  - If Playwright MCP cannot observe the download or stream result, report the browser evidence plus `SKIP`/`BLOCKED` for artifact verification rather than claiming full PASS.

- **Auth/session/route protection**
  - Preflight the active role/session without exposing private values in screenshots or reports.
  - Verify redirects, current URL, visible account/role context, forbidden banners, and relevant API status when available.
  - For expired or missing sessions, prove both the attempted protected route/action and the resulting denied or login state.

- **Admin/security/authorization flows**
  - Use safe test data and avoid destructive confirmations unless the Approved TC explicitly requires them and approvals allow the action.
  - For denied access, highlight the denial state and record the attempted action or route.
  - For allowed admin actions, prove the before/after UI state and any required audit/status signal visible to the browser.
  - When a run switches between roles such as admin and non-admin, capture session reset or re-auth evidence before judging the next role-specific TC.

- **Realtime/WebSocket/progress streams**
  - Capture initial connection-visible state, at least one meaningful progress/event update when the TC expects streaming, and the terminal state.
  - Use network/console evidence when browser UI alone cannot distinguish polling from streaming, but do not fail solely because the transport is not inspectable unless the TC requires transport proof.

- **Form validation and negative UX**
  - Negative/validation `PASS` requires visible validation evidence. Highlight fields, messages, banners, or nearest group ancestors per `.agents/rules/automation-evidence.mdc`.
  - Confirm invalid submissions do not advance to success pages or mutate visible state when the TC requires no-op behavior.

- **Cross-page data consistency**
  - Preserve a stable identifier from the source page, then verify the same value or expected transformed value on the destination page.
  - When identifiers are masked, normalized, translated, or reformatted, document the expected transformation before judging the destination evidence.
  - Capture evidence on both pages and document any masking/redaction used for sensitive identifiers.

- **Pagination/filter/search/sort**
  - Establish the baseline list state before applying controls.
  - Verify the target row/value, count, order, empty state, or cleared-filter recovery that the TC specifies.
  - Treat unstable seed data as a precondition issue; do not infer PASS from unrelated rows.

- **Responsive/accessibility/visual interaction**
  - Only run viewport, keyboard, focus, hover, contrast, or layout checks that the TC scopes in.
  - For accessibility-scoped TCs, capture the relevant accessibility, keyboard, focus-order, or screen-reader-visible evidence instead of relying on visual screenshots alone.
  - Capture the relevant viewport/focus/interaction state and note any skipped matrix entries with reason.

- **Console/network diagnostics**
  - For API-heavy, export, auth, worker, realtime, or unexplained failure cases, inspect console messages and network requests when available.
  - Match network evidence precisely to the user action, endpoint, status/body, job key, or route under test; avoid inferring results from unrelated polling, analytics, prefetch, or background refresh traffic.
  - Record unexpected errors relevant to the TC. Do not fail a TC for unrelated warnings unless the TC's acceptance criteria require a clean console/network trace.

- **Isolation, retries, and flake triage**
  - Treat shared accounts, mutable records, cached auth state, parallel execution, environment drift, and missing cleanup as precondition or isolation risks; record the risk instead of masking it with repeated attempts.
  - Re-run a failed TC only when the run scope, existing report class, or user explicitly asks for re-run evidence; a passing retry does not erase the original failure and should be reported as flake evidence.
  - Prefer targeted condition waits and source-of-truth evidence over increasing global waits. If the wait budget must be extended, cite the Approved TC, visible app contract, precedent report, or app/API reference that justifies it.

- **Artifact and MCP limitation handling**
  - When Playwright MCP exposes only snapshots, screenshots, console, and network metadata, report exactly those evidence types; do not claim trace/video/download-file proof unless the runtime actually exposes it or the TC approved another artifact source.
  - If official Playwright best practice would require unavailable runner features such as storage state setup, trace viewer, video, fixtures, workers, or test-level retries, document the limitation as a test-environment constraint rather than silently simulating it.

5. **Write report**
   - Use `.agents/templates/test-report-template.md`.
   - Save to `docs/test_results/YYYY-MM-DD-NNNNNN-<topic>-report.md`.
   - Use the same date/sequence as the test-case doc when it is a first run for that doc; increment only for distinct new report runs when needed.
   - Embed screenshots with `../../output/<filename>.png`.
   - Include Vietnam wall-clock timestamp in `Updated`.

6. **Failures**
   - Do not auto-fix code by default.
   - For product bugs, document symptom, likely root cause, evidence, and follow-up.
   - Fix code only if the user explicitly requested auto-fix or the execution is part of a fix workflow.

## Completion checklist

- Report exists under `docs/test_results/`.
- Every executed Approved TC has `PASS`, `FAIL`, `SKIP`, or `BLOCKED`.
- Every `SKIP` or `BLOCKED` has a reason.
- Every TC has evidence or a documented blocker.
- Error/validation evidence uses highlighted screenshots.
- Final actions were actually executed or documented as N/A.
- No secrets were written to artifacts.
