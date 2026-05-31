# AirDeck — Gesture Photobooth

Take photos with **hand gestures** in front of your webcam — draw shapes with
your fingers, hold a hand sign to fire the shutter, add face stickers, and print
a Korean-style 4-cut strip. All computer vision runs **100% on-device** — the
camera feed never leaves the browser.

Built with React 18 + Vite + TypeScript + Zustand + Tailwind and
[`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision)
(GestureRecognizer for hands, FaceLandmarker for accessory anchoring).

> The UI ships in Vietnamese; the code, comments and docs are in English.

## Features

- **Two capture styles** (mutually exclusive, so they never conflict):
  - **Shape mode** (default) — your hands draw a geometric shape that follows
    you live: triangle 🔺 (thumb + index + middle), star ⭐ (thumb + pinky),
    circle ⭕ (open hand), or a two-hand 3D frame 🔲. Holding a shape steadily
    runs a two-shot "frame window" flow that composites you _inside_ the shape.
  - **Gesture mode** — hold a recognized hand sign to auto-trigger the
    countdown: 🖐️ open palm, ✌️ victory, 🤟 rock, 🤙 call me, 👍 thumb up,
    ☝️ point.
- **Self-timer** — instant / 3 / 5 / 10s, with an on-screen countdown and tick
  sounds. Manual capture anytime via the button or the **Space** key.
- **Filters** — Original, B&W, Film, Warm, Cool, Vintage (applied live via CSS
  and baked into the capture via the canvas `filter`).
- **Decorative frames** — None, Classic, Film, Sunset, Mint. Previewed live
  around the stage and composited into the saved photo.
- **Face accessories (stickers)** — glasses, sunglasses, top hat, crown, bunny
  ears, cat ears, mustache, clown nose. Anchored to face landmarks in real time
  (tracking head position, scale and roll) and baked into captures.
- **Auto enhancement** — gentle gray-world white balance + auto levels to
  rescue shots taken in poor lighting.
- **4-cut photo strip** — pick up to 4 photos, choose a layout (vertical 4 or
  2×2 grid) and a color theme (Classic, Film, Sunset, Mint, Blush), preview at
  full size, then download.
- **Gallery, framed preview, share** — review captures, zoom, download, or share
  via the Web Share API where supported.
- **Sound** — shutter / countdown / saved cues, toggleable and persisted.
- **Guided tour & onboarding** — a spotlight tour runs once on first visit; the
  help button replays it anytime.
- **Live HUD** — FPS, hands detected, current gesture, resolution, and
  camera/engine status.
- **Persisted settings** — filter, frame, timer, capture mode, accessories,
  strip layout/theme, sound and onboarding state are saved to `localStorage`.
- **Accessible by design** — keyboard capture, ARIA roles/live regions,
  `prefers-reduced-motion`, and a usable shell even before the camera starts.

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

| Script                  | What it does                           |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start the Vite dev server              |
| `npm run build`         | Typecheck + production build           |
| `npm run preview`       | Preview the production build           |
| `npm run lint`          | ESLint (zero warnings allowed)         |
| `npm run format`        | Format `src` with Prettier             |
| `npm run format:check`  | Check formatting without writing       |
| `npm run typecheck`     | TypeScript project typecheck           |
| `npm run test`          | Run unit/component tests (Vitest)      |
| `npm run test:watch`    | Vitest in watch mode                   |
| `npm run test:coverage` | Tests with coverage                    |
| `npm run e2e`           | Playwright E2E (fake camera, headless) |
| `npm run e2e:install`   | Install Playwright's Chromium + deps   |

## Configuration

MediaPipe WASM + model URLs default to the official CDN. To self-host (offline
/ air-gapped), copy `.env.example` to `.env` and override the `VITE_*` paths:

| Variable                        | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `VITE_MEDIAPIPE_WASM_BASE`      | Base URL for the MediaPipe WASM runtime     |
| `VITE_GESTURE_RECOGNIZER_MODEL` | Hand gesture recognizer model (`.task`)     |
| `VITE_HAND_LANDMARKER_MODEL`    | Hand landmarker model (`.task`)             |
| `VITE_FACE_LANDMARKER_MODEL`    | Face landmarker model (accessory anchoring) |
| `VITE_POSE_LANDMARKER_MODEL`    | Pose landmarker model (`.task`)             |

## Architecture

```
webcam ─┬─▶ HandEngine (GestureRecognizer, WASM/GPU)
        │     │  landmarks + gesture
        │     ▼
        │   useGestureLoop ──┬─▶ shutterGesture (held hand sign)
        │                    ├─▶ gestureShapes (triangle/star/circle/quad)
        │                    └─▶ GestureFsm (debounce, single-fire)
        │                                   │
        │                                   ▼
        │                          StudioView (countdown → capture)
        │                                   │
        └─▶ FaceEngine (FaceLandmarker) ────┤  accessory placement
                                            ▼
                          capture → filters + enhance + frame
                                + accessories + shape ─▶ photo / 4-cut strip
```

- `src/lib` — framework-agnostic math: geometry, One-Euro filter, FPS/adaptive
  quality, and a tiny persistence helper. Pure and unit-tested.
- `src/features/gestures` — finger-state detection, pinch, swipe, the gesture
  state machine, and the configurable gesture→intent map.
- `src/features/photo` — countdown, shutter-gesture classification, gesture
  shapes, filters, frames, accessories, auto-enhance, capture, strip/frame
  composition, and share. Pure logic separated from the React/canvas glue.
- `src/features/cv` — MediaPipe wrappers (`handEngine`, `faceEngine`) plus the
  real-time `useGestureLoop` and `useFaceLoop`.
- `src/features/camera` — `getUserMedia` lifecycle + capture constraints.
- `src/features/tour` — guided-tour steps, positioning, and mock art.
- `src/components` — React UI (studio stage, HUD, controls, gallery, strip
  maker, accessory picker, tour, onboarding).
- `src/store` — the Zustand store and persisted-settings slice.

The design deliberately separates **pure logic** (testable without a camera)
from **DOM/MediaPipe glue** (covered by E2E with a fake camera and an injectable
hand-landmark hook).

## Testing

Unit + component tests run with **Vitest** (+ Testing Library, jsdom); **E2E**
runs with **Playwright** using Chromium's fake media stream, so no physical
camera is required in CI. E2E specs cover the studio, gesture shapes, onboarding,
and an evidence/screenshot flow.

See [`docs/`](docs/) for the structured product + test artifacts:

- `docs/product/` — PRD + test-case companion (traceable requirements).
- `docs/test_cases/` — approved UI test-case documents.
- `docs/test_results/` — execution reports.

## License

MIT
