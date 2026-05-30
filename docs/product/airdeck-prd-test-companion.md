# AirDeck — PRD Test-Case Companion

- **Status:** Draft
- **Source PRD:** `docs/product/airdeck-prd.md` (Draft)
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)

> Generated following `th-generate-prd`. Statuses use the skill vocabulary:
> `Draft | Ready | Provisional | Blocked | Gap`.

## Coverage summary

| Category | Count |
| --- | --- |
| Positive | 8 |
| Negative | 3 |
| Accessibility | 1 |
| Total | 12 |

## Detailed test cases

| ID | Title | Type | Pre / Steps | Expected | Verifies | Status | Method |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Shell renders | Positive | Open `/` | Header, 3 mode buttons, privacy note visible | REQ-001 | Ready | E2E |
| TC-002 | Mode switch updates cheatsheet | Positive | Click "Slides" | aria-pressed=true, cheatsheet shows slides map | REQ-007 | Ready | E2E |
| TC-003 | Enable camera → ready | Positive | Click Enable camera | HUD camera = ready; video visible | REQ-002 | Ready | E2E (fake cam) |
| TC-004 | Manual capture → gallery | Positive | Camera ready → Capture | One image added to gallery | REQ-004 | Ready | E2E (fake cam) |
| TC-005 | Filter applies to preview | Positive | Camera on → click B&W | Preview CSS filter contains grayscale | REQ-006 | Ready | E2E (fake cam) |
| TC-006 | Capture disabled before ready | Negative | Open `/`, no camera | Capture button disabled | REQ-009 | Ready | E2E |
| TC-007 | Pinch normalized detection | Positive | Synthetic pinch hand | isPinching true; distance < ratio | BR-2 | Ready | Unit |
| TC-008 | Gesture debounce single-fire | Positive | Hold gesture N frames | Fires once, no repeat while held | REQ-008, BR-1 | Ready | Unit |
| TC-009 | Countdown fires once at zero | Positive | Start 3s countdown | justFinished true exactly once | REQ-005 | Ready | Unit |
| TC-010 | Camera permission denied | Negative | getUserMedia rejects NotAllowedError | status=denied + message + retry | REQ-002 | Provisional | Unit/Manual |
| TC-011 | Capture with no video dims | Negative | video 0x0 | capturePhoto returns null (no crash) | REQ-004 | Ready | Unit |
| TC-012 | Reduced-motion respected | Accessibility | prefers-reduced-motion | Animations effectively disabled | NFR-3 | Provisional | Manual |

## Must Coverage Gate

| REQ | Direct TC | Coverage |
| --- | --- | --- |
| REQ-001 | TC-001 | Direct |
| REQ-002 | TC-003, TC-010 | Direct |
| REQ-003 | (HUD asserted in unit Hud.test + TC-003) | Direct |
| REQ-004 | TC-004, TC-011 | Direct |
| REQ-005 | TC-009 | Direct |
| REQ-006 | TC-005 | Direct |
| REQ-007 | TC-002 | Direct |
| REQ-008 | TC-008 | Direct |

## Coverage gaps

| ID | Gap | Reason |
| --- | --- | --- |
| GAP-1 | Live gesture-driven shutter (model inference end-to-end) | Requires loading the MediaPipe model + simulated hand input; best run via Playwright MCP or manual. Not in hermetic CI. |
| GAP-2 | TC-012 reduced-motion automated assertion | Needs visual/animation harness; currently manual. |

## Handoff notes for `th-generate-automation-tests`

- Treat TC-001…TC-006 and TC-011 as primary automation oracles (deterministic,
  fake-camera friendly).
- GAP-1 is the candidate for Playwright-MCP execution once the model load and a
  synthetic-hand injection harness are available.
