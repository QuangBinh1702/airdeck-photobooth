import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { Landmark } from '@/types/landmarks';

const WASM_BASE =
  import.meta.env.VITE_MEDIAPIPE_WASM_BASE ??
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

const FACE_MODEL =
  import.meta.env.VITE_FACE_LANDMARKER_MODEL ??
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * Thin wrapper around MediaPipe FaceLandmarker (video mode) used to anchor
 * accessory stickers. Returns plain landmark arrays so the placement logic
 * stays framework- and MediaPipe-agnostic (and unit-testable).
 */
export class FaceEngine {
  private landmarker: FaceLandmarker | null = null;

  async init(numFaces = 1): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  }

  get ready(): boolean {
    return this.landmarker !== null;
  }

  /** Detect faces on a video frame; returns one landmark array per face. */
  detect(video: HTMLVideoElement, timestamp: number): Landmark[][] {
    if (!this.landmarker) return [];
    const raw: FaceLandmarkerResult = this.landmarker.detectForVideo(
      video,
      timestamp,
    );
    return (raw.faceLandmarks ?? []).map((face) =>
      face.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    );
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
