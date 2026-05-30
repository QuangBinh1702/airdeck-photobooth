import type { FingerStates } from '@/features/gestures/fingerState';

/**
 * Named single-hand "shutter" gestures. Each maps a finger-extension pattern
 * to a recognizable hand sign the user can hold to trigger a capture, similar
 * to gesture-photobooth experiences.
 */
export type ShutterGestureId =
  | 'open_palm' // 🖐️ all five fingers
  | 'victory' // ✌️ index + middle
  | 'rock' // 🤟 thumb + index + pinky (ILoveYou)
  | 'call_me' // 🤙 thumb + pinky
  | 'thumb_up' // 👍 thumb only
  | 'point' // ☝️ index only
  | 'none';

export interface ShutterGestureDef {
  id: ShutterGestureId;
  label: string;
  emoji: string;
  /** Exact finger pattern (true = extended). Used for classification. */
  pattern: FingerStates;
}

/**
 * Definitions ordered by specificity. Classification picks the first exact
 * match so more distinctive signs win over generic ones.
 */
export const SHUTTER_GESTURES: ShutterGestureDef[] = [
  {
    id: 'open_palm',
    label: 'Open palm',
    emoji: '🖐️',
    pattern: { thumb: true, index: true, middle: true, ring: true, pinky: true },
  },
  {
    id: 'victory',
    label: 'Victory',
    emoji: '✌️',
    pattern: {
      thumb: false,
      index: true,
      middle: true,
      ring: false,
      pinky: false,
    },
  },
  {
    id: 'rock',
    label: 'Rock',
    emoji: '🤟',
    pattern: {
      thumb: true,
      index: true,
      middle: false,
      ring: false,
      pinky: true,
    },
  },
  {
    id: 'call_me',
    label: 'Call me',
    emoji: '🤙',
    pattern: {
      thumb: true,
      index: false,
      middle: false,
      ring: false,
      pinky: true,
    },
  },
  {
    id: 'thumb_up',
    label: 'Thumb up',
    emoji: '👍',
    pattern: {
      thumb: true,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    },
  },
  {
    id: 'point',
    label: 'Point',
    emoji: '☝️',
    pattern: {
      thumb: false,
      index: true,
      middle: false,
      ring: false,
      pinky: false,
    },
  },
];

function patternsEqual(a: FingerStates, b: FingerStates): boolean {
  return (
    a.thumb === b.thumb &&
    a.index === b.index &&
    a.middle === b.middle &&
    a.ring === b.ring &&
    a.pinky === b.pinky
  );
}

/** Classify a finger-state pattern into a named shutter gesture. */
export function classifyShutterGesture(
  states: FingerStates,
): ShutterGestureId {
  const match = SHUTTER_GESTURES.find((g) => patternsEqual(g.pattern, states));
  return match?.id ?? 'none';
}

export function getShutterGesture(
  id: ShutterGestureId,
): ShutterGestureDef | undefined {
  return SHUTTER_GESTURES.find((g) => g.id === id);
}
