/**
 * Tiny Web Audio sound effects for the photobooth (no asset files needed).
 * A single lazily-created AudioContext is reused. All calls are no-ops if the
 * Web Audio API is unavailable or the context can't start.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  // Browsers suspend the context until a user gesture; resume best-effort.
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

/** Play a short tone. Internal helper. */
function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
): void {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ac.currentTime;
  const dur = durationMs / 1000;
  // Quick attack + exponential release for a soft "blip".
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(env).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** A soft tick for each countdown second. */
export function playCountdownTick(): void {
  tone(660, 110, 'triangle', 0.12);
}

/** A brighter blip for the final "go" / capture moment. */
export function playShutter(): void {
  // Two quick rising notes = a pleasant "snap".
  tone(880, 70, 'square', 0.12);
  window.setTimeout(() => tone(1320, 120, 'square', 0.1), 70);
}

/** A gentle confirmation chime (e.g. photo saved). */
export function playSaved(): void {
  tone(988, 90, 'sine', 0.1);
  window.setTimeout(() => tone(1319, 140, 'sine', 0.09), 90);
}
