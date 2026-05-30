import {
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision';
import type { GestureId } from '@/types/gestures';
import type { HandLandmarks, Handedness } from '@/types/landmarks';

const WASM_BASE =
  import.meta.env.VITE_MEDIAPIPE_WASM_BASE ??
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

const GESTURE_MODEL =
  import.meta.env.VITE_GESTURE_RECOGNIZER_MODEL ??
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

export interface HandFrameResult {
  hands: HandLandmarks[];
  handedness: Handedness[];
  gestures: { id: GestureId; score: number }[];
}

/**
 * Thin wrapper around MediaPipe GestureRecognizer for video mode.
 *
 * Keeps all MediaPipe-specific wiring in one place so the rest of the app
 * works with plain landmark/gesture data (and can be tested with fakes).
 */
export class HandEngine {
  private recognizer: GestureRecognizer | null = null;

  async init(numHands = 2): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    this.recognizer = await GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: GESTURE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands,
    });
  }

  get ready(): boolean {
    return this.recognizer !== null;
  }

  /** Run recognition on a video frame at the given timestamp (ms). */
  detect(video: HTMLVideoElement, timestamp: number): HandFrameResult {
    if (!this.recognizer) {
      return { hands: [], handedness: [], gestures: [] };
    }
    const raw: GestureRecognizerResult = this.recognizer.recognizeForVideo(
      video,
      timestamp,
    );
    return normalizeResult(raw);
  }

  close(): void {
    this.recognizer?.close();
    this.recognizer = null;
  }
}

/** Convert a MediaPipe result into our framework-agnostic shape. */
export function normalizeResult(
  raw: GestureRecognizerResult,
): HandFrameResult {
  const hands: HandLandmarks[] = (raw.landmarks ?? []).map((lm) =>
    lm.map((p) => ({ x: p.x, y: p.y, z: p.z })),
  );
  const handedness: Handedness[] = (raw.handedness ?? []).map(
    (h) => (h[0]?.categoryName as Handedness) ?? 'Right',
  );
  const gestures = (raw.gestures ?? []).map((g) => ({
    id: (g[0]?.categoryName as GestureId) ?? 'None',
    score: g[0]?.score ?? 0,
  }));
  return { hands, handedness, gestures };
}
