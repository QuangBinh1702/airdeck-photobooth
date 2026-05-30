# AirDeck — Product Requirements Document

- **Status:** Draft
- **Owner:** Engineering
- **Updated:** 2026-05-30 (Asia/Ho_Chi_Minh)
- **Input classification:** Rough idea → implemented codebase (this repo)
- **Companion:** `docs/product/airdeck-prd-test-companion.md`

> Generated following the `th-generate-prd` skill. Note: the skill references
> `.agents/templates/` and several `.agents/rules/*` files that are not present
> in this workspace; this PRD therefore follows the skill's structure and intent
> rather than a literal template include.

---

## 1. Source summary

| Kind | Detail |
| --- | --- |
| Verified facts (code) | React 18 + Vite + TS app; CV via `@mediapipe/tasks-vision`; pure-logic modules under `src/lib` and `src/features`; 87 passing unit tests; 6 passing Playwright E2E with fake camera. |
| Assumptions | Users run on a desktop/laptop with a built-in RGB webcam in adequate lighting. |
| Source conflicts | None material — PRD and code authored together. |
| Blocking questions | None outstanding for MVP scope (see §10). |

## 2. Problem statement & business impact

Touch-based control is impractical in several real contexts: hands-free
presenting, hygienic public kiosks, accessibility for users who struggle with a
mouse, and "messy/clean hands" environments (cooking, medical, repair). AirDeck
provides a **touchless control + photo experience** that runs entirely in the
browser with no app install and no server round-trips, which lowers adoption
friction and protects privacy.

## 3. Users / personas

- **P1 Presenter** — wants to advance slides and annotate without a clicker.
- **P2 Kiosk visitor** — browses/takes a photo without touching a shared screen.
- **P3 Accessibility user** — prefers large gestures over fine pointer control.
- **P4 Gen-Z photobooth user** — wants a fun, shareable 4-cut photo strip.

## 4. Success metrics

| ID | Metric | Target |
| --- | --- | --- |
| SM-1 | Inference frame rate on a mid laptop | ≥ 24 FPS |
| SM-2 | Gesture → action latency | < 100 ms |
| SM-3 | Camera feed leaving device | 0 (fully on-device) |
| SM-4 | Core-logic unit test coverage | ≥ 70% |

## 5. Scope

**In scope (MVP):** photo studio (gesture shutter, countdown, filters, gallery),
live HUD, mode switching, configurable gesture→intent mapping, cursor & slides
logic layers, accessibility fallbacks.

**Out of scope (MVP):** face/identity recognition, mobile-first layout, cloud
sync/accounts, custom-trained gesture models (Phase 6 — future), background
replacement (future).

## 6. Flows

- **Happy path (photo):** open app → enable camera → model loads → strike a
  pose / show ✌️ → 3-2-1 countdown → photo captured into gallery.
- **Alternate:** user clicks the manual Capture button instead of gesturing.
- **Failure:** camera permission denied → explanatory message + retry button;
  model fails to load → engine status `error` with reason; no device → message.

## 7. Business rules

| ID | Rule | Confidence |
| --- | --- | --- |
| BR-1 | A gesture must be held for N consecutive confident frames before it fires once (no machine-gun repeats). | High |
| BR-2 | Pinch detection is normalized by hand size so it is distance-invariant. | High |
| BR-3 | Captured images mirror the on-screen selfie preview. | High |
| BR-4 | The real-time loop pauses when the browser tab is hidden. | High |
| BR-5 | Camera access requires a secure context (HTTPS/localhost). | High |
| BR-6 | **Capture mode is exclusive.** Exactly one of two styles is active: `shape` (hands draw geometric shapes; the photo is triggered by button/Space/timer and the shape is baked into the image) or `gesture` (holding a hand sign auto-triggers the countdown). Shapes are never drawn in `gesture` mode, and hand signs never auto-capture in `shape` mode. This removes the ambiguity where an open palm meant both "draw a circle" and "take the photo". | High |
| BR-7 | In `shape` mode, the geometric overlay (triangle/star/circle/quad) is composited into the saved photo so the captured image matches what the user framed. | High |

## 8. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| REQ-001 | The app shell renders a header, three mode buttons, and an on-device privacy note. | Must |
| REQ-002 | The user can enable the webcam; status transitions idle→requesting→ready, or denied/no-device/error. | Must |
| REQ-003 | The HUD shows camera status, engine status, FPS, hands detected, and current gesture. | Must |
| REQ-004 | The user can capture a photo manually; the capture appears in the gallery. | Must |
| REQ-005 | A confirmed `photo.shutter` intent starts a 3-2-1 countdown then captures. | Must |
| REQ-006 | Selecting a filter updates the live preview and the captured image. | Must |
| REQ-007 | Switching mode updates the gesture cheatsheet to that mode's mapping. | Must |
| REQ-008 | Gesture recognition is debounced so one physical gesture fires one intent. | Must |
| REQ-009 | The capture button is disabled until the camera is ready. | Should |
| REQ-010 | Captured images can be downloaded / shared (filename + Web Share). | Should |
| REQ-015 | In `shape` capture mode, forming a hand sign draws a geometric shape (🔺 triangle = thumb+index+middle, ⭐ star = thumb+pinky, ⭕ circle = open palm, 🔲 quad = two hands) that follows the hand(s) in real time and is composited into the captured photo. | Must |
| REQ-016 | The user can switch between `shape` and `gesture` capture modes; the two are mutually exclusive so a single hand pose never means two things at once. | Must |
| REQ-017 | In `shape` mode, holding a valid shape steadily auto-starts the self-timer countdown and then captures (no button press needed), mirroring the reference photobooth. | Must |
| REQ-018 | The side cheatsheet content follows the active photo capture mode: it lists the geometric shapes in `shape` mode and the hand signs in `gesture` mode. | Should |
| REQ-019 | The user can select multiple captured photos and compose them into a Korean-style 4-cut strip (layout `vertical-4` or `grid-2x2`, selectable color theme), preview it, and download it as a single image. Selection is capacity-capped and ordered. | Should |
| REQ-020 | In `shape` mode, triggering a capture while a shape is active runs a two-shot "frame window" flow: shot 1 is the full-frame background, shot 2 is clipped inside the geometric shape, and the two are composited into one image (looking through the shape at a second moment). | Should |

## 9. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Cursor/pose coordinates are smoothed (One-Euro) to remove jitter. |
| NFR-2 | The pipeline adapts quality when FPS drops (AdaptiveQuality). |
| NFR-3 | UI respects `prefers-reduced-motion`. |
| NFR-4 | No camera frames are transmitted off the device. |

## 10. Open questions / decisions

| ID | Question | Severity | Default |
| --- | --- | --- | --- |
| Q-1 | Which gestures map to shutter by default? | Non-blocking | ✌️ and ✋ (implemented). |
| Q-2 | Self-host MediaPipe models vs CDN? | Non-blocking | CDN with `.env` override. |

## 11. Requirement traceability (summary)

Each `REQ-###` maps to one or more `TC-###` in the companion. Must requirements
all have direct coverage; see the companion's Must Coverage Gate.

## 12. Change log

| Date | Change |
| --- | --- |
| 2026-05-30 | Initial Draft generated alongside the MVP implementation. |
