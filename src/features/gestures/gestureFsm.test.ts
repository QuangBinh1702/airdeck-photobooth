import { describe, expect, it } from 'vitest';
import { GestureFsm } from '@/features/gestures/gestureFsm';

describe('GestureFsm', () => {
  it('fires only after the hold threshold is reached', () => {
    const fsm = new GestureFsm({ holdFrames: 3, minScore: 0.6 });
    expect(fsm.update('Victory', 0.9)).toBeNull();
    expect(fsm.update('Victory', 0.9)).toBeNull();
    expect(fsm.update('Victory', 0.9)).toBe('Victory');
  });

  it('does not re-fire while the gesture is held', () => {
    const fsm = new GestureFsm({ holdFrames: 2 });
    fsm.update('Thumb_Up', 0.9);
    expect(fsm.update('Thumb_Up', 0.9)).toBe('Thumb_Up');
    expect(fsm.update('Thumb_Up', 0.9)).toBeNull();
    expect(fsm.update('Thumb_Up', 0.9)).toBeNull();
    expect(fsm.current).toBe('Thumb_Up');
  });

  it('ignores low-confidence samples', () => {
    const fsm = new GestureFsm({ holdFrames: 2, minScore: 0.7 });
    expect(fsm.update('Open_Palm', 0.5)).toBeNull();
    expect(fsm.update('Open_Palm', 0.5)).toBeNull();
    expect(fsm.current).toBeNull();
  });

  it('releases after enough None frames so the gesture can fire again', () => {
    const fsm = new GestureFsm({ holdFrames: 2, releaseFrames: 2 });
    fsm.update('Victory', 0.9);
    expect(fsm.update('Victory', 0.9)).toBe('Victory');
    // Release.
    fsm.update('None', 0);
    fsm.update('None', 0);
    expect(fsm.current).toBeNull();
    // Re-acquire and fire again.
    fsm.update('Victory', 0.9);
    expect(fsm.update('Victory', 0.9)).toBe('Victory');
  });

  it('switches directly between two different held gestures', () => {
    const fsm = new GestureFsm({ holdFrames: 2, releaseFrames: 5 });
    fsm.update('Thumb_Up', 0.9);
    expect(fsm.update('Thumb_Up', 0.9)).toBe('Thumb_Up');
    // New gesture must satisfy hold frames before firing.
    expect(fsm.update('Open_Palm', 0.9)).toBeNull();
    expect(fsm.update('Open_Palm', 0.9)).toBe('Open_Palm');
  });

  it('treats null id as no gesture', () => {
    const fsm = new GestureFsm({ holdFrames: 1 });
    expect(fsm.update(null, 1)).toBeNull();
  });

  it('resets cleanly', () => {
    const fsm = new GestureFsm({ holdFrames: 1 });
    fsm.update('Victory', 0.9);
    fsm.reset();
    expect(fsm.current).toBeNull();
  });
});
