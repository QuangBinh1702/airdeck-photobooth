import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  playCountdownTick,
  playSaved,
  playShutter,
} from '@/features/photo/sound';

/**
 * jsdom has no real Web Audio. We stub a minimal AudioContext and assert the
 * sound helpers create oscillators (i.e. attempt to play) without throwing.
 */
class FakeOsc {
  type = 'sine';
  frequency = { value: 0 };
  connect() {
    return this;
  }
  start() {}
  stop() {}
}
class FakeGain {
  gain = {
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  connect() {
    return this;
  }
}

let oscCount = 0;

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    oscCount += 1;
    return new FakeOsc() as unknown as OscillatorNode;
  }
  createGain() {
    return new FakeGain() as unknown as GainNode;
  }
  resume() {
    return Promise.resolve();
  }
}

describe('sound effects', () => {
  beforeEach(() => {
    oscCount = 0;
    vi.useFakeTimers();
    (window as unknown as { AudioContext: unknown }).AudioContext =
      FakeAudioContext;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('countdown tick creates an oscillator', () => {
    playCountdownTick();
    expect(oscCount).toBeGreaterThanOrEqual(1);
  });

  it('shutter schedules two notes', () => {
    playShutter();
    vi.advanceTimersByTime(100);
    expect(oscCount).toBeGreaterThanOrEqual(2);
  });

  it('saved chime plays without throwing', () => {
    expect(() => {
      playSaved();
      vi.advanceTimersByTime(200);
    }).not.toThrow();
  });
});
