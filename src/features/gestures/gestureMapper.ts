import type { GestureId, IntentType } from '@/types/gestures';

/** App modes change what a gesture means. */
export type AppMode = 'cursor' | 'slides' | 'photo';

/**
 * Configurable mapping from a confirmed gesture to an intent, per mode.
 * Kept as plain data so it can be edited/persisted without touching logic.
 */
export type GestureMap = Record<AppMode, Partial<Record<GestureId, IntentType>>>;

export const DEFAULT_GESTURE_MAP: GestureMap = {
  cursor: {
    Pinch: 'cursor.click',
    Closed_Fist: 'cursor.dragStart',
    Open_Palm: 'cursor.dragEnd',
  },
  slides: {
    Swipe_Right: 'slide.next',
    Swipe_Left: 'slide.prev',
    Closed_Fist: 'slide.blank',
    Thumb_Up: 'slide.next',
  },
  photo: {
    Victory: 'photo.shutter',
    Open_Palm: 'photo.shutter',
    Thumb_Up: 'command.confirm',
    Closed_Fist: 'command.cancel',
  },
};

/**
 * Resolve a confirmed gesture into an intent for the given mode.
 * Returns null when the gesture is unmapped in that mode.
 */
export function mapGestureToIntent(
  map: GestureMap,
  mode: AppMode,
  gesture: GestureId,
): IntentType | null {
  return map[mode][gesture] ?? null;
}

/** Merge a partial override on top of the default map (immutably). */
export function withOverrides(
  base: GestureMap,
  overrides: Partial<GestureMap>,
): GestureMap {
  return {
    cursor: { ...base.cursor, ...overrides.cursor },
    slides: { ...base.slides, ...overrides.slides },
    photo: { ...base.photo, ...overrides.photo },
  };
}
