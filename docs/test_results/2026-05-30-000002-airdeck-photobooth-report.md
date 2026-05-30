# AirDeck Gesture Photobooth — Test Execution Report

- **Test-case doc:** `docs/test_cases/2026-05-30-000002-airdeck-photobooth-test-case.md` (Approved)
- **Run scope:** Full suite (TC-001…TC-016)
- **Environment:** Windows · Node 22.14 · Chromium 130 (Playwright 1.48) ·
  fake media stream (`--use-fake-device-for-media-stream`)
- **Executor:** Project Playwright runner (`npx playwright test e2e/evidence.spec.ts`).
  Playwright MCP is not available in this workspace — see note below.
- **Evidence:** one screenshot per executed TC under `output/`, embedded below.
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)

> Execution follows the intent of `th-execute-automation-tests`. The skill's
> required executor (Playwright MCP) and `.agents/rules/automation-evidence.mdc`
> / `.agents/templates/` are not present in this workspace, so evidence is
> captured with the project's own Playwright runner (a faithful equivalent of
> the MCP screenshot step). Recorded as an environment constraint, not a silent
> substitution.

## Result summary

| TC | Title | Result |
| --- | --- | --- |
| TC-001 | Shell renders core elements | PASS |
| TC-002 | Mode switch updates cheatsheet | PASS |
| TC-003 | Enable camera reaches ready | PASS |
| TC-004 | Manual capture adds a photo | PASS |
| TC-005 | Filter applies to live preview | PASS |
| TC-006 | Self-timer selection | PASS |
| TC-007 | Frame selection | PASS |
| TC-008 | Select photo → framed preview → download enabled | PASS |
| TC-009 | Delete a photo | PASS |
| TC-010 | Clear all photos | PASS |
| TC-011 | Gesture-shutter toggle hides the legend | PASS |
| TC-012 | Download disabled with no selection | PASS |
| TC-013 | Capture disabled before camera ready | PASS |
| TC-014 | Keyboard Space triggers capture | PASS |
| TC-015 | Countdown overlay for timed capture | PASS |
| TC-016 | Live gesture shutter (model inference) | BLOCKED |

**Totals:** 15 PASS · 0 FAIL · 0 SKIP · 1 BLOCKED.

Runner output: `15 passed (19.6s)`.

## Evidence

### TC-001 — Shell renders core elements
![TC-001](../../output/TC-001-shell.png)

### TC-002 — Mode switch updates cheatsheet
![TC-002](../../output/TC-002-mode-slides.png)

### TC-003 — Enable camera reaches ready
![TC-003](../../output/TC-003-camera-ready.png)

### TC-004 — Manual capture adds a photo
![TC-004](../../output/TC-004-capture.png)

### TC-005 — Filter applies to live preview
![TC-005](../../output/TC-005-filter-bw.png)

### TC-006 — Self-timer selection
![TC-006](../../output/TC-006-timer-5s.png)

### TC-007 — Frame selection
![TC-007](../../output/TC-007-frame-mint.png)

### TC-008 — Select photo → framed preview → download enabled
![TC-008](../../output/TC-008-framed-download.png)

### TC-009 — Delete a photo
![TC-009](../../output/TC-009-delete.png)

### TC-010 — Clear all photos
![TC-010](../../output/TC-010-clear-all.png)

### TC-011 — Gesture-shutter toggle hides the legend
![TC-011](../../output/TC-011-gesture-off.png)

### TC-012 — Download disabled with no selection
![TC-012](../../output/TC-012-download-disabled.png)

### TC-013 — Capture disabled before camera ready
![TC-013](../../output/TC-013-capture-disabled.png)

### TC-014 — Keyboard Space triggers capture
![TC-014](../../output/TC-014-space-capture.png)

### TC-015 — Countdown overlay for timed capture
![TC-015](../../output/TC-015-countdown.png)

## BLOCKED detail — TC-016 (live gesture shutter)

- **Why:** Chromium's fake camera renders a synthetic test pattern, not a hand,
  and the MediaPipe gesture model is not downloaded in hermetic CI. The
  recognizer therefore cannot emit a real gesture deterministically.
- **Mitigation in place:** the deterministic sub-logic is unit-tested —
  `shutterGesture.test.ts` (6 named signs classification), `gestureFsm.test.ts`
  (debounce / single-fire), `countdown.test.ts` (3-2-1 timing). 121 unit tests
  pass overall.
- **Recommended follow-up:** add a Playwright-MCP (or injected-frame) harness
  that feeds recorded hand frames into the model, then promote TC-016 to PASS.
  Tracked as GAP-1 in `docs/product/airdeck-prd-test-companion.md`.

## Notes

- No secrets were written to any artifact.
- No product bugs were found. One test-only fix was applied during execution:
  TC-011 now targets the `gesture-legend` test id to avoid a strict-mode text
  collision with the cheatsheet ("Open palm" vs "Open Palm"); no product code
  behavior changed.

---

## Addendum — Gesture-driven shape overlay evidence

Added after user feedback that the reference photobooth's signature visual (a
shape that follows the hand) was missing. The feature is now implemented and
verified. Synthetic hands are injected via `window.__airdeckInjectHands` so the
overlay can be proven deterministically with the fake camera.

Runner output: `5 passed (11.8s)`.

| TC | Shape | Result |
| --- | --- | --- |
| SHAPE-01 | Triangle (🔺) | PASS |
| SHAPE-02 | Star (⭐) | PASS |
| SHAPE-03 | Circle (⭕) | PASS |
| SHAPE-04 | Two-hand quad (🔲) | PASS |
| SHAPE-05 | Capture includes shape | PASS |

### SHAPE-01 — Triangle
![SHAPE-01](../../output/SHAPE-01-triangle.png)

### SHAPE-02 — Star
![SHAPE-02](../../output/SHAPE-02-star.png)

### SHAPE-03 — Circle
![SHAPE-03](../../output/SHAPE-03-circle.png)

### SHAPE-04 — Two-hand quad frame
![SHAPE-04](../../output/SHAPE-04-quad.png)

### SHAPE-05 — Captured photo with shape composited in
![SHAPE-05](../../output/SHAPE-05-captured-with-shape.png)

> Note: shape-evidence screenshots are visibly larger than the plain-UI shots
> (~220–248 KB vs ~185 KB) because they contain the rendered overlay pixels.

---

## Addendum 2 — Capture-mode conflict resolved

User reported a real conflict: an open palm meant **both** "draw a circle"
(shape) **and** "take the photo" (shutter gesture), so it did both at once.

**Fix:** replaced the boolean "gesture shutter on/off" with an exclusive
`captureMode` (`shape` | `gesture`), per BR-6:

- `shape` (default, matches the reference site): hands draw shapes; the photo is
  taken by button / Space / timer; the shape is baked into the saved image.
- `gesture`: holding a hand sign auto-triggers the countdown; no shapes drawn.

Shapes are suppressed in `gesture` mode and hand signs never auto-capture in
`shape` mode, so a single hand pose can never mean two things at once.

Re-ran the full E2E suite after the change: **30 passed (25.2s)**; unit tests
**137 passed**.

| TC | What it proves | Result |
| --- | --- | --- |
| TC-011 | Switching capture mode swaps the legend | PASS |
| SHAPE-05 | Shape baked into the captured photo (shape mode) | PASS |
| SHAPE-06 | Gesture mode suppresses shapes (no conflict) | PASS |

### TC-011 — Capture-mode switch
![TC-011](../../output/TC-011-capture-mode.png)

### SHAPE-06 — Gesture mode shows no shape (conflict gone)
![SHAPE-06](../../output/SHAPE-06-gesture-no-shape.png)

---

## Addendum 3 — Shape auto-capture + mode-aware cheatsheet

Two follow-up requests implemented:

1. **Shape mode now auto-captures** (REQ-017): holding a valid geometric shape
   steadily starts the ⏱ self-timer countdown and then captures, with the shape
   baked into the photo — same UX as the reference site (no button press
   required). Implemented via a dedicated shape-hold FSM in the gesture loop.
2. **Mode-aware cheatsheet** (REQ-018): the side panel ("Cử chỉ · …") now lists
   the geometric shapes (🔺⭐⭕🔲) in shape mode and the hand signs (✌️👍🖐️…) in
   gesture mode, so it always matches what is active.

Stability: capped Playwright workers to 3 (+1 retry) so parallel CV loops do not
starve the CPU; the full suite is green.

Re-ran everything after the change: **unit 140 passed**, **E2E 31 passed**.

| TC | What it proves | Result |
| --- | --- | --- |
| SHAPE-07 | Holding a shape auto-starts countdown then captures | PASS |
| GestureCheatsheet.test | Cheatsheet swaps shape/gesture lists by mode | PASS (unit) |

### SHAPE-07 — Shape hold → countdown → capture
![SHAPE-07](../../output/SHAPE-07-shape-countdown.png)

---

## Addendum 4 — 4-Cut Photo Strip

Implemented the Korean-style 4-cut strip (PLAN Phase 3.5.5): select multiple
captured photos → compose into a vertical-4 or 2×2 grid strip with a color theme
→ preview → download as one PNG.

- New pure logic: `composeStrip.ts` (uses the already-tested `photoStrip.ts`
  cell math + cover-crop), `stripThemes.ts` (5 themes), and store strip-selection
  state (ordered, capacity-capped at 4, pruned when a photo is deleted).
- New UI: `StripMaker` (layout + theme pickers, live preview, download) and a
  per-photo "+ dải" toggle in the gallery showing the selection order.

Re-ran everything: **unit 157 passed**, **E2E 33 passed** (16/16 evidence specs
clean on the final run).

| TC | What it proves | Result |
| --- | --- | --- |
| TC-017 | Build a 4-cut strip from 4 photos + enable download | PASS |
| composeStrip.test (8) | Strip composition / capacity / themes / caption | PASS (unit) |
| stripThemes.test (3) | Theme catalog + lookup | PASS (unit) |
| appStore strip tests (5) | Selection order, cap, prune-on-delete | PASS (unit) |

### TC-017 — 4-cut photo strip
![TC-017](../../output/TC-017-strip.png)

---

## Addendum 5 — Bugfix: shape auto-capture machine-gunned

**Reported:** in shape mode the camera kept auto-capturing and saving photos
without stopping while a shape was held.

**Root cause:** the 2-second cooldown after an auto shot was only stored in React
state (`cooling`) used for a UI hint; `startCountdown` did not actually gate on
it. Combined with detection flicker (a held shape briefly dropping a frame and
re-appearing), the re-arm logic kept firing → repeated captures. A second issue:
the dev/E2E injection fast-path treated an empty hands array as "no injection",
so "hand lowered" was never processed.

**Fix:**
- Added a synchronous `coolingRef` (and a tracked timeout) that `startCountdown`
  checks before any auto shot; re-arm is also blocked during the cooldown and
  while a countdown is running.
- The injection hook now distinguishes "no hook" (`undefined`) from "hand
  lowered" (`[]`), so lowering the hand correctly re-arms auto-capture.

**Verification (new E2E):**

| TC | Proves | Result |
| --- | --- | --- |
| SHAPE-08 | Holding a shape continuously captures exactly once (no machine-gun) | PASS |
| SHAPE-09 | Lowering then re-forming the shape allows a second shot | PASS |

Full re-run after the fix: **unit 157 passed**, **E2E 34 passed**.

### SHAPE-08 — Held shape, single capture
![SHAPE-08](../../output/SHAPE-08-no-machinegun.png)

### SHAPE-09 — Re-arm after lowering the hand
![SHAPE-09](../../output/SHAPE-09-rearm.png)

---

## Addendum 6 — Two-shot "frame window" for shape capture

**Request:** when capturing with a geometric shape, take the first photo as the
background, then take a second photo that appears *inside* the shape (like
looking through the frame the hands make).

**Implemented (REQ-020):** in shape mode, a capture now runs a two-shot flow:
1. Shot 1 — full-frame background (flash + "Đã lưu" feedback, then a
   "Giữ nguyên khung tay" phase hint).
2. Short pause + countdown → Shot 2.
3. The two are composited off-screen by `composeShapeShot()`: background full
   frame, second shot clipped to the triangle/star/circle/quad path, with a glow
   outline. One composite image is saved.

New pure module `composeShapeShot.ts` (background + clipped inset + outline) is
unit-tested (5 cases incl. polygon vs circular clip paths and error guards).

Re-ran everything: **unit 162 passed**, **E2E 34 passed**.

| TC | Proves | Result |
| --- | --- | --- |
| SHAPE-05 | Shape capture produces a frame-window composite (single result) | PASS |
| SHAPE-07 | Held shape auto-runs the two-shot flow and saves one composite | PASS |
| SHAPE-08 | Held shape still does not machine-gun (one composite) | PASS |
| SHAPE-09 | Lower + re-form allows a second composite | PASS |
| composeShapeShot.test (5) | Background + clipped inset + outline geometry | PASS (unit) |

### SHAPE-05 — Frame-window composite
![SHAPE-05](../../output/SHAPE-05-frame-window.png)

---

## Addendum 7 — Live frame-window preview for shot 2

**Request:** after the first shape shot, the second shot must show the first
photo as the background with the live camera visible ONLY inside the shape, so
the user can see they are being photographed "inside the star/triangle/etc."
before the shot is taken. Also fixed a mirror bug so the shape lands where the
hands framed it.

**Implemented:**
- New `FrameWindowPreview` component: during shot 2 it renders, every frame, the
  frozen first shot as a full-frame background and the LIVE mirrored camera
  clipped to the frozen shape, plus a glowing outline. The live hand overlay is
  hidden during this phase so there is no double-up.
- The shape captured at shot 1 is frozen and reused for shot 2 and the final
  composite (no drift if the hands move).
- Mirror fix: the composite now mirrors the shape coordinates to match the
  mirrored selfie frames, so the window lines up with the hands.

Re-ran everything: **unit 162 passed**, **E2E 34 passed**.

| TC | Proves | Result |
| --- | --- | --- |
| SHAPE-05 | Phase hint + live frame-window preview appear, one composite saved | PASS |

### SHAPE-05 — Live frame-window preview (frozen bg + live camera in shape)
![SHAPE-05](../../output/SHAPE-05-frame-window.png)

---

## Addendum 8 — Bugfix: frame-window used the wrong (early) shape

**Reported:** the window for shot 2 used the shape from the FIRST frame (when the
gesture was first detected), not the final hand pose at the end of the countdown.

**Root cause:** `startCountdown` captured `lastFrameRef.current.shape` before the
countdown and passed that stale value into the flow.

**Fix:** the frame-window flow now re-reads `lastFrameRef.current.shape` at the
moment shot 1 is taken (i.e. when the countdown finishes), so the window matches
the final hand pose. If no shape is present at that moment, it falls back to a
single background photo.

Re-ran everything after the fix: **unit 162 passed**, **E2E 34 passed**.
