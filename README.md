# AirDeck — Touchless Control Hub

Control the web and take photos with **hand gestures** via your webcam. All
computer vision runs **100% on-device** — the camera feed never leaves the
browser.

Built with React 18 + Vite + TypeScript and
[`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision)
(GestureRecognizer / HandLandmarker / PoseLandmarker).

## Features

- **Photo Studio** — gesture shutter (✌️ / ✋ → 3-2-1 countdown → capture),
  real-time filters (B&W, film, vintage, warm, cool), a gallery, and the
  building blocks for a Korean-style 4-cut photo strip.
- **Cursor mode** — pinch to click (logic layer ready).
- **Slides mode** — swipe left/right to navigate (logic layer ready).
- **Live HUD** — FPS, hands detected, current gesture, engine/camera status.
- **Accessible by design** — keyboard/mouse fallbacks, `prefers-reduced-motion`,
  ARIA roles, no camera required to use the shell.

## Requirements

- Node.js 20+ (developed on Node 22).
- A webcam — your **laptop's built-in camera is enough**; no external hardware
  needed. Good lighting matters more than resolution.
- A secure context: `getUserMedia` requires **HTTPS or `localhost`**.

## Getting started

```bash
npm install
npm run dev
# open the printed http://localhost:5173 URL and allow camera access
```

## Scripts

| Script                  | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                     |
| `npm run build`         | Typecheck + production build                  |
| `npm run preview`       | Preview the production build                  |
| `npm run lint`          | ESLint (zero warnings allowed)                |
| `npm run typecheck`     | TypeScript project typecheck                  |
| `npm run test`          | Run unit tests (Vitest)                       |
| `npm run test:coverage` | Unit tests with coverage (70% gate)           |
| `npm run e2e`           | Playwright E2E (fake camera, headless)        |

## Configuration

MediaPipe WASM + model URLs default to the official CDN. To self-host (offline
/ air-gapped), copy `.env.example` to `.env` and override the `VITE_*` paths.

## Architecture

```
webcam ─▶ HandEngine (MediaPipe WASM/GPU)
            │  landmarks + gesture
            ▼
   derived gestures (pinch / swipe)  ──▶ GestureFsm (debounce, single-fire)
            │                                   │
            ▼                                   ▼
        OneEuroFilter (smoothing)        gestureMapper ─▶ Intent ─▶ feature
```

- `src/lib` — framework-agnostic math: geometry, One-Euro filter, FPS/adaptive
  quality. Pure and fully unit-tested.
- `src/features/gestures` — finger-state detection, pinch, swipe, the gesture
  state machine, and the configurable gesture→intent map.
- `src/features/photo` — countdown, photo-strip layout, pose matching, filters,
  capture, share. Pure logic separated from the React/canvas glue.
- `src/features/cv` — MediaPipe wrapper + the real-time `useGestureLoop`.
- `src/components` — React UI (stage, HUD, cheatsheet).

The design deliberately separates **pure logic** (testable without a camera)
from **DOM/MediaPipe glue** (covered by E2E with a fake camera).

## Testing

See [`docs/`](docs/) for the structured test artifacts:

- `docs/product/` — PRD + test-case companion (traceable requirements).
- `docs/test_cases/` — Approved UI test-case document.
- `docs/test_results/` — execution report.

Unit + component tests run with Vitest; E2E runs with Playwright using
Chromium's fake media stream so no physical camera is required in CI.

## License

MIT
