import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GESTURE_MAP,
  mapGestureToIntent,
  withOverrides,
} from '@/features/gestures/gestureMapper';

describe('mapGestureToIntent', () => {
  it('maps a pinch to a click in cursor mode', () => {
    expect(mapGestureToIntent(DEFAULT_GESTURE_MAP, 'cursor', 'Pinch')).toBe(
      'cursor.click',
    );
  });

  it('maps a right swipe to next slide in slides mode', () => {
    expect(
      mapGestureToIntent(DEFAULT_GESTURE_MAP, 'slides', 'Swipe_Right'),
    ).toBe('slide.next');
  });

  it('maps victory to shutter in photo mode', () => {
    expect(mapGestureToIntent(DEFAULT_GESTURE_MAP, 'photo', 'Victory')).toBe(
      'photo.shutter',
    );
  });

  it('returns null for an unmapped gesture in a mode', () => {
    expect(
      mapGestureToIntent(DEFAULT_GESTURE_MAP, 'cursor', 'Swipe_Left'),
    ).toBeNull();
  });
});

describe('withOverrides', () => {
  it('overrides a single mapping without mutating the base', () => {
    const custom = withOverrides(DEFAULT_GESTURE_MAP, {
      photo: { Thumb_Up: 'photo.shutter' },
    });
    expect(custom.photo.Thumb_Up).toBe('photo.shutter');
    // Base map is untouched.
    expect(DEFAULT_GESTURE_MAP.photo.Thumb_Up).toBe('command.confirm');
    // Other entries preserved.
    expect(custom.photo.Victory).toBe('photo.shutter');
    expect(custom.cursor.Pinch).toBe('cursor.click');
  });
});
