/**
 * Pure countdown state machine for the gesture shutter.
 *
 * Kept free of timers/DOM so it can be unit-tested deterministically by
 * advancing a virtual clock. The UI layer drives it from requestAnimationFrame
 * and reacts to `justFinished` to actually capture the frame.
 */
export interface CountdownState {
  running: boolean;
  /** Whole seconds remaining to display (e.g. 3, 2, 1). 0 means capture now. */
  secondsLeft: number;
  /** True only on the single tick where the countdown reaches zero. */
  justFinished: boolean;
}

export class Countdown {
  private readonly durationMs: number;
  private startTime: number | null = null;
  private finished = false;

  constructor(durationSeconds = 3) {
    this.durationMs = durationSeconds * 1000;
  }

  get isRunning(): boolean {
    return this.startTime !== null && !this.finished;
  }

  /** Begin (or restart) the countdown at the given timestamp. */
  start(now: number): void {
    this.startTime = now;
    this.finished = false;
  }

  cancel(): void {
    this.startTime = null;
    this.finished = false;
  }

  /** Advance the clock and return the current display state. */
  tick(now: number): CountdownState {
    if (this.startTime === null) {
      return { running: false, secondsLeft: 0, justFinished: false };
    }
    const elapsed = now - this.startTime;
    const remaining = this.durationMs - elapsed;

    if (remaining <= 0) {
      const justFinished = !this.finished;
      this.finished = true;
      this.startTime = null;
      return { running: false, secondsLeft: 0, justFinished };
    }

    return {
      running: true,
      secondsLeft: Math.ceil(remaining / 1000),
      justFinished: false,
    };
  }
}
