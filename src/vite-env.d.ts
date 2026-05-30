/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDIAPIPE_WASM_BASE?: string;
  readonly VITE_HAND_LANDMARKER_MODEL?: string;
  readonly VITE_GESTURE_RECOGNIZER_MODEL?: string;
  readonly VITE_POSE_LANDMARKER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
