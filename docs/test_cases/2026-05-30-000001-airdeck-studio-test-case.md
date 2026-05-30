# AirDeck Photo Studio — UI Automation Test Cases

- **Status:** Approved
- **Topic:** AirDeck shell + Photo Studio (camera, capture, filters, modes, a11y)
- **Source:** `docs/product/airdeck-prd.md` + codebase
- **Target URL:** `http://localhost:4173` (preview build)
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)
- **Auto-approval:** Granted (user requested full E2E build "no approval needed").

> Drafted per `th-generate-automation-tests`. Browser execution uses Chromium
> with a fake media stream (`--use-fake-device-for-media-stream`) so no physical
> camera is required. Evidence and report live in `docs/test_results/`.
>
> Tooling note: the skill's preferred executor is `th-execute-automation-tests`
> via **Playwright MCP**, which is not installed in this workspace. Execution was
> therefore performed with the project's own Playwright runner (`npm run e2e`),
> which is the closest faithful equivalent. See report for details.

## Preconditions (all TCs)

- App built and served via `npm run build && npm run preview -- --port 4173`.
- Browser launched with fake camera + granted camera permission.

## Test cases

### TC-001 — Shell renders core elements · POSITIVE
- **Steps:** Navigate to `/`.
- **Expected:** "AirDeck" heading visible; "Photo Studio" button visible;
  on-device privacy note ("never leaves this browser") visible.
- **Traceability:** REQ-001.
- **Final action:** None (read-only).

### TC-002 — Mode switch updates cheatsheet · POSITIVE
- **Steps:** Click the "Slides" mode button.
- **Expected:** "Slides" button has `aria-pressed=true`; cheatsheet header reads
  "Gestures · slides".
- **Traceability:** REQ-007.
- **Final action:** Switch back to Photo Studio (N/A for stateless run).

### TC-003 — Enable camera reaches ready · POSITIVE
- **Steps:** Click "Enable camera"; wait for HUD camera status.
- **Expected:** HUD camera = "ready" within 15s; video element visible.
- **Traceability:** REQ-002.
- **Final action:** Camera stream released on navigation/teardown.

### TC-004 — Manual capture adds to gallery · POSITIVE
- **Steps:** Enable camera; wait for non-zero video dimensions; click "Capture".
- **Expected:** Gallery contains exactly one image.
- **Traceability:** REQ-004.
- **Final action:** Gallery is in-memory; cleared on reload.

### TC-005 — Filter applies to live preview · POSITIVE
- **Steps:** Enable camera; click "B&W" filter.
- **Expected:** Preview element inline `filter` style contains "grayscale".
- **Traceability:** REQ-006.
- **Final action:** Reset filter to Original (N/A stateless).

### TC-006 — Capture disabled before camera ready · NEGATIVE
- **Steps:** Navigate to `/` without enabling the camera.
- **Expected:** "Capture" button is disabled.
- **Traceability:** REQ-009.
- **Final action:** None.

### TC-007 — Live gesture shutter (model inference) · POSITIVE
- **Steps:** Enable camera + load model; present a ✌️ gesture; observe 3-2-1
  countdown then capture.
- **Expected:** Countdown overlay shows 3→2→1; one photo added to gallery.
- **Traceability:** REQ-005, BR-1.
- **Status:** BLOCKED — requires live MediaPipe model + synthetic-hand injection
  (Playwright MCP harness). Tracked as GAP-1 in the PRD companion.
- **Final action:** N/A.

## Problems & solutions

| Problem | Resolution |
| --- | --- |
| Playwright MCP + `.agents/templates` / `.agents/rules` not present | Execute with project Playwright runner; document as environment constraint. |
| Live model inference not deterministic in CI | TC-007 marked BLOCKED; covered by unit tests for the underlying FSM/countdown logic. |
