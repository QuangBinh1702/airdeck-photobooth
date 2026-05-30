import type { GestureId } from '@/types/gestures';

/**
 * Debounced gesture state machine.
 *
 * Real-time recognizers flicker: a single held gesture produces dozens of
 * frames, and confidence wobbles around the threshold. This FSM converts the
 * noisy per-frame stream into stable, single-fire events:
 *
 *  - A gesture must be observed for `holdFrames` consecutive frames above
 *    `minScore` before it is "confirmed" (fires `onEnter`).
 *  - It will not fire again until the gesture changes (or `None` is seen for
 *    `releaseFrames`), preventing machine-gun repeats while held.
 */
export interface GestureFsmOptions {
  minScore?: number;
  holdFrames?: number;
  releaseFrames?: number;
}

export interface GestureEvent {
  /** Fired once when a gesture becomes confirmed. */
  entered: GestureId | null;
}

export class GestureFsm {
  private readonly minScore: number;
  private readonly holdFrames: number;
  private readonly releaseFrames: number;

  private candidate: GestureId | null = null;
  private candidateCount = 0;
  private confirmed: GestureId | null = null;
  private noneCount = 0;

  constructor(opts: GestureFsmOptions = {}) {
    this.minScore = opts.minScore ?? 0.6;
    this.holdFrames = opts.holdFrames ?? 3;
    this.releaseFrames = opts.releaseFrames ?? 2;
  }

  /** The gesture currently confirmed as being held, if any. */
  get current(): GestureId | null {
    return this.confirmed;
  }

  /**
   * Feed one frame of recognition.
   * @returns the gesture that fired this frame (on enter), or null.
   */
  update(id: GestureId | null, score: number): GestureId | null {
    const valid = id !== null && id !== 'None' && score >= this.minScore;

    if (!valid) {
      this.noneCount += 1;
      this.candidate = null;
      this.candidateCount = 0;
      if (this.noneCount >= this.releaseFrames) {
        this.confirmed = null;
      }
      return null;
    }

    this.noneCount = 0;

    // Already holding this exact gesture: do not re-fire.
    if (this.confirmed === id) {
      return null;
    }

    if (this.candidate === id) {
      this.candidateCount += 1;
    } else {
      this.candidate = id;
      this.candidateCount = 1;
    }

    if (this.candidateCount >= this.holdFrames) {
      this.confirmed = id;
      this.candidate = null;
      this.candidateCount = 0;
      return id;
    }
    return null;
  }

  reset(): void {
    this.candidate = null;
    this.candidateCount = 0;
    this.confirmed = null;
    this.noneCount = 0;
  }
}
