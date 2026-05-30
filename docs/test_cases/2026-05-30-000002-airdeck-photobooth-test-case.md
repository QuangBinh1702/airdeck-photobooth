# AirDeck Gesture Photobooth — UI Automation Test Cases

- **Status:** Approved
- **Topic:** Photobooth (multi-gesture shutter, timer, frames, gallery select, framed download, a11y)
- **Source:** `docs/product/airdeck-prd.md` + codebase + reference UX (gesture photobooth)
- **Target URL:** `http://localhost:4173` (preview build)
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)
- **Auto-approval:** Granted (user asked to write covering test cases and run them with image evidence).

> Drafted per `th-generate-automation-tests`. Execution captures one screenshot
> per TC into `output/` as visual evidence (see report). The skill's preferred
> executor (`th-execute-automation-tests` via Playwright MCP) is unavailable in
> this workspace; the project's Playwright runner is used as the faithful
> equivalent and this is recorded as an environment constraint.

## Preconditions (all TCs)

- Production build served via `npm run build && npm run preview -- --port 4173`.
- Chromium launched with a fake camera + granted camera permission
  (`--use-fake-device-for-media-stream`, configured in `playwright.config.ts`).
- The fake camera renders a synthetic test pattern (no real hand), so live
  model-driven gesture capture is out of scope here (see TC-016, BLOCKED).

## Coverage summary

| Category | Count |
| --- | --- |
| POSITIVE | 11 |
| NEGATIVE | 3 |
| Accessibility | 1 |
| Blocked (documented) | 1 |
| **Total** | **16** |

## Test cases

### TC-001 — Shell renders core elements · POSITIVE
- **Steps:** Open `/`.
- **Expected:** "AirDeck" heading, "Photo Studio" mode button, and the
  on-device privacy note ("không rời khỏi trình duyệt") are visible.
- **Traceability:** REQ-001. **Evidence:** `output/TC-001-shell.png`.

### TC-002 — Mode switch updates cheatsheet · POSITIVE
- **Steps:** Click "Slides".
- **Expected:** Slides has `aria-pressed=true`; cheatsheet reads "Gestures · slides".
- **Traceability:** REQ-007. **Evidence:** `output/TC-002-mode-slides.png`.

### TC-003 — Enable camera reaches ready · POSITIVE
- **Steps:** Click "Bật camera"; wait for ready + non-zero video size.
- **Expected:** HUD camera = ready; preview visible.
- **Traceability:** REQ-002. **Evidence:** `output/TC-003-camera-ready.png`.

### TC-004 — Manual capture adds a photo · POSITIVE
- **Steps:** Timer = instant; camera ready; click "Chụp ảnh".
- **Expected:** Gallery contains exactly one photo.
- **Traceability:** REQ-004. **Evidence:** `output/TC-004-capture.png`.

### TC-005 — Filter applies to live preview · POSITIVE
- **Steps:** Camera ready; click "B&W".
- **Expected:** Preview inline `filter` contains "grayscale".
- **Traceability:** REQ-006. **Evidence:** `output/TC-005-filter-bw.png`.

### TC-006 — Self-timer selection · POSITIVE
- **Steps:** Click the "5s" timer.
- **Expected:** "5s" timer has `aria-pressed=true`.
- **Traceability:** REQ-005. **Evidence:** `output/TC-006-timer-5s.png`.

### TC-007 — Frame selection · POSITIVE
- **Steps:** Click the "Mint" frame.
- **Expected:** "Mint" frame has `aria-pressed=true`.
- **Traceability:** REQ-011 (frames). **Evidence:** `output/TC-007-frame-mint.png`.

### TC-008 — Select photo → framed preview → download enabled · POSITIVE
- **Steps:** Capture a photo; pick "Sunset" frame; click the gallery item.
- **Expected:** Framed preview image visible; "Tải ảnh về" button enabled.
- **Traceability:** REQ-012 (gallery select), REQ-013 (framed download).
  **Evidence:** `output/TC-008-framed-download.png`.

### TC-009 — Delete a photo · POSITIVE
- **Steps:** Capture; hover item; click delete (✕).
- **Expected:** Gallery item count returns to 0.
- **Traceability:** REQ-014 (gallery manage). **Evidence:** `output/TC-009-delete.png`.

### TC-010 — Clear all photos · POSITIVE
- **Steps:** Capture two photos; click "Xoá tất cả".
- **Expected:** Empty-state text shown.
- **Traceability:** REQ-014. **Evidence:** `output/TC-010-clear-all.png`.

### TC-011 — Gesture-shutter toggle hides the legend · POSITIVE
- **Steps:** Uncheck "Chụp bằng cử chỉ tay".
- **Expected:** The gesture legend (e.g. "Open palm") is no longer rendered.
- **Traceability:** REQ-015 (multi-gesture shutter). **Evidence:** `output/TC-011-gesture-off.png`.

### TC-012 — Download disabled with no selection · NEGATIVE
- **Steps:** Open `/`; do not select any photo.
- **Expected:** "Tải ảnh về" button is disabled.
- **Traceability:** REQ-013. **Evidence:** `output/TC-012-download-disabled.png`.

### TC-013 — Capture disabled before camera ready · NEGATIVE
- **Steps:** Open `/` without enabling the camera.
- **Expected:** "Chụp ảnh" button disabled.
- **Traceability:** REQ-009. **Evidence:** `output/TC-013-capture-disabled.png`.

### TC-014 — Keyboard Space triggers capture · Accessibility
- **Steps:** Timer instant; camera ready; press Space.
- **Expected:** A photo is captured (gallery item appears).
- **Traceability:** REQ-004, NFR-3 (fallback input). **Evidence:** `output/TC-014-space-capture.png`.

### TC-015 — Countdown overlay for timed capture · POSITIVE
- **Steps:** Timer = 3s; camera ready; click "Chụp ảnh".
- **Expected:** Countdown overlay appears; a photo is captured after ~3s.
- **Traceability:** REQ-005. **Evidence:** `output/TC-015-countdown.png`.

### TC-016 — Live gesture shutter (model inference) · POSITIVE
- **Steps:** Camera + model loaded; hold ✌️/🖐️; observe countdown + capture.
- **Expected:** A held hand sign triggers the shutter and captures a photo.
- **Status:** BLOCKED — the fake camera cannot present a real hand, and the
  MediaPipe model is not loaded in hermetic CI. Underlying logic is unit-tested
  (`shutterGesture.test.ts`, `gestureFsm.test.ts`, `countdown.test.ts`).
- **Traceability:** REQ-015, BR-1. Tracked as GAP-1 in the PRD companion.

## Problems & solutions

| Problem | Resolution |
| --- | --- |
| Playwright MCP + `.agents/templates`/`.agents/rules` absent | Use project Playwright runner; screenshot-per-TC evidence into `output/`; documented as environment constraint. |
| Fake camera shows a test pattern, not a hand | TC-016 marked BLOCKED; gesture logic covered by unit tests. |
| Countdown timing flakiness | TC-015 asserts overlay within 2s and capture within 6s using condition-based waits. |

---

## Addendum — Gesture-driven shape overlay (the reference photobooth visual)

These cases verify the signature feature of the reference UX: forming a hand
sign draws a geometric shape that follows the hand in real time. Because the
fake camera cannot present a real hand, synthetic 21-point hands are injected
through the app's `window.__airdeckInjectHands` dev hook, which drives the same
overlay pipeline as live inference. Evidence is captured to `output/`.

### SHAPE-01 — Triangle overlay · POSITIVE
- **Pattern:** thumb + index + middle extended.
- **Expected:** badge "🔺 Tam giác" visible; triangle drawn on the overlay.
- **Evidence:** `output/SHAPE-01-triangle.png`.

### SHAPE-02 — Star overlay · POSITIVE
- **Pattern:** thumb + pinky extended.
- **Expected:** badge "⭐ Ngôi sao" visible; 5-point star drawn.
- **Evidence:** `output/SHAPE-02-star.png`.

### SHAPE-03 — Circle overlay · POSITIVE
- **Pattern:** all five fingers extended (open palm).
- **Expected:** badge "⭕ Vòng tròn" visible; circle drawn around the palm.
- **Evidence:** `output/SHAPE-03-circle.png`.

### SHAPE-04 — Two-hand quad frame · POSITIVE
- **Pattern:** two open hands.
- **Expected:** badge "🔲 Khung 3D" visible; quadrilateral drawn between hands.
- **Evidence:** `output/SHAPE-04-quad.png`.

### SHAPE-05 — Captured photo includes the shape · POSITIVE
- **Steps:** (shape mode, default) form a circle, capture (instant timer).
- **Expected:** a photo is saved with the shape composited into it.
- **Evidence:** `output/SHAPE-05-captured-with-shape.png`.

### SHAPE-06 — Gesture mode suppresses shapes (no conflict) · POSITIVE
- **Steps:** switch to "✌️ Cử chỉ tay" mode; inject an open-palm hand.
- **Expected:** no shape badge/overlay appears — the two capture styles never
  overlap (resolves BR-6 conflict).
- **Evidence:** `output/SHAPE-06-gesture-no-shape.png`.

> Traceability: REQ-015 (gesture-driven shapes), REQ-016 + BR-6 (exclusive
> capture modes), BR-7 (shape baked into photo). The injection hook only affects
> dev/E2E; it does not alter the live inference path. Underlying geometry is
> unit-tested in `gestureShapes.test.ts` and `drawOverlay.test.ts`.

---

## Addendum 2 — 4-Cut Photo Strip (Korean-style)

### TC-017 — Build a 4-cut strip and download · POSITIVE
- **Steps:** capture 4 photos (instant timer); click the "+ dải" toggle on each
  to add them to the strip selection; choose a theme (Sunset).
- **Expected:** the strip preview image renders; the "Tải dải ảnh" button is
  enabled.
- **Traceability:** REQ-019. **Evidence:** `output/TC-017-strip.png`.

> The strip layout math (`photoStrip.ts`), composition (`composeStrip.ts`),
> themes (`stripThemes.ts`), and the store selection logic (capacity cap,
> ordering, prune-on-delete) are unit-tested. The strip is composed entirely on
> a canvas and downloaded as a single PNG — no server involved.
