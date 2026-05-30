/**
 * Shared geometric types used across the CV pipeline.
 *
 * These mirror the shape of MediaPipe Tasks Vision results but are kept
 * framework-agnostic so the gesture/pose logic can be unit-tested without
 * loading any WASM/model.
 */

/** A normalized landmark: x/y in [0,1] relative to the image, z relative depth. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  /** Optional visibility/confidence in [0,1] (pose landmarks expose this). */
  visibility?: number;
}

/** Handedness as reported by MediaPipe ("Left" | "Right"), mirrored image space. */
export type Handedness = 'Left' | 'Right';

/** The 21 hand landmarks for a single detected hand. */
export type HandLandmarks = Landmark[];

/** The 33 pose landmarks for a single detected body. */
export type PoseLandmarks = Landmark[];

/**
 * Index constants for the 21 MediaPipe hand landmarks.
 * @see https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 */
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

/**
 * Index constants for the 33 MediaPipe pose landmarks (subset most used).
 * @see https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
} as const;
