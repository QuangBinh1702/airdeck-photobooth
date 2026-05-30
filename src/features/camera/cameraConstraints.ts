/**
 * Build getUserMedia constraints that ask the device for its best still-image
 * quality: highest practical resolution, 30fps, and the camera's automatic
 * exposure / white-balance / focus so lighting is handled by the sensor's ISP.
 *
 * `ideal` (not `exact`) is used everywhere so the browser gracefully falls back
 * to whatever the hardware actually supports instead of throwing.
 */
export function buildVideoConstraints(
  facingMode: 'user' | 'environment' = 'user',
): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode,
      // Aim high; the browser clamps to the sensor's real maximum.
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      // Continuous auto modes let the sensor's ISP handle lighting.
      advanced: [
        { focusMode: 'continuous' },
        { exposureMode: 'continuous' },
        { whiteBalanceMode: 'continuous' },
      ],
    },
  };
}

/**
 * After the stream starts, try to apply auto exposure / white-balance / focus
 * via track constraints. Safe to call on any track: unsupported keys are
 * ignored and failures are swallowed (older browsers / locked-down cameras).
 */
export async function applyAutoSettings(track: MediaStreamTrack): Promise<void> {
  const caps = (
    track.getCapabilities?.() ?? {}
  ) as Record<string, unknown>;
  const advanced: Record<string, unknown>[] = [];

  if ('focusMode' in caps) advanced.push({ focusMode: 'continuous' });
  if ('exposureMode' in caps) advanced.push({ exposureMode: 'continuous' });
  if ('whiteBalanceMode' in caps)
    advanced.push({ whiteBalanceMode: 'continuous' });

  if (advanced.length === 0) return;
  try {
    await track.applyConstraints({
      advanced,
    } as MediaTrackConstraints);
  } catch {
    /* camera doesn't allow these; the sensor's defaults still apply */
  }
}

/** Human-readable "actual" resolution of a running video track, for the HUD. */
export function trackResolution(track: MediaStreamTrack): {
  width: number;
  height: number;
} {
  const s = track.getSettings?.() ?? {};
  return { width: s.width ?? 0, height: s.height ?? 0 };
}
