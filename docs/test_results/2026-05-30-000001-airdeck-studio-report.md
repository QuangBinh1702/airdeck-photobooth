# AirDeck Photo Studio — Test Execution Report

- **Test-case doc:** `docs/test_cases/2026-05-30-000001-airdeck-studio-test-case.md` (Approved)
- **Run scope:** Full suite (TC-001…TC-007)
- **Environment:** Windows · Node 22.14 · Chromium 130 (Playwright 1.48) ·
  fake media stream (`--use-fake-device-for-media-stream`)
- **Executor:** Project Playwright runner (`npm run e2e`). Playwright MCP not
  available in this workspace — see note below.
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)

> Execution follows the intent of `th-execute-automation-tests`. The skill's
> required executor (Playwright MCP) and `.agents/rules/automation-evidence.mdc`
> are not present in this workspace, so screenshots-as-evidence were replaced by
> the deterministic assertion output of the Playwright runner. This is recorded
> as an environment constraint, not a silent substitution.

## Result summary

| TC | Title | Result |
| --- | --- | --- |
| TC-001 | Shell renders core elements | PASS |
| TC-002 | Mode switch updates cheatsheet | PASS |
| TC-003 | Enable camera reaches ready | PASS |
| TC-004 | Manual capture adds to gallery | PASS |
| TC-005 | Filter applies to live preview | PASS |
| TC-006 | Capture disabled before camera ready | PASS |
| TC-007 | Live gesture shutter (model inference) | BLOCKED |

**Totals:** 6 PASS · 0 FAIL · 0 SKIP · 1 BLOCKED.

## Evidence

E2E runner output (6 passed in ~8s):

```
ok 1 studio.spec.ts › renders header, modes and on-device privacy note
ok 2 studio.spec.ts › applies a filter to the live preview
ok 3 studio.spec.ts › switches modes and updates the gesture cheatsheet
ok 4 studio.spec.ts › starts the fake camera and reaches ready state
ok 5 studio.spec.ts › manual capture adds an image to the gallery
ok 6 studio.spec.ts › capture button is disabled until the camera is ready
6 passed (7.9s)
```

Supporting unit/component evidence (Vitest): **87 passed**, core-logic coverage
**71.65%** (statements), with pure modules 88–100%. The logic behind the
BLOCKED TC-007 (gesture FSM single-fire + 3-2-1 countdown) is directly covered
by `gestureFsm.test.ts` and `countdown.test.ts`.

## BLOCKED detail — TC-007

- **Why:** Live gesture capture needs (a) the MediaPipe gesture model downloaded
  and initialized, and (b) a way to inject a synthetic hand into the model's
  video input. Chromium's fake camera produces a generic test pattern, not a
  hand, so the recognizer cannot emit a real gesture deterministically.
- **Mitigation in place:** The deterministic sub-logic is unit-tested
  (debounce/FSM, countdown, gesture→intent mapping, capture compositing).
- **Recommended follow-up:** Implement a Playwright-MCP (or injected-frame)
  harness that feeds recorded hand frames, then promote TC-007 to PASS.
  Tracked as GAP-1 in `docs/product/airdeck-prd-test-companion.md`.

## Notes

- No secrets were written to any artifact.
- No product bugs were found; no code auto-fix was performed beyond test setup.
