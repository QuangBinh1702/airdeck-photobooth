/**
 * Download/share helpers for captured images.
 *
 * `dataUrlToBlob` is pure and unit-tested. `downloadDataUrl` and `sharePhoto`
 * touch the DOM / Web Share API and are exercised via E2E.
 */

/** Convert a data URL (e.g. from canvas.toDataURL) into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    throw new Error('dataUrlToBlob: not a base64 data URL');
  }
  const mime = match[1]!;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Build a timestamped filename like `airdeck-20260530-153012.png`. */
export function buildFilename(
  prefix = 'airdeck',
  ext = 'png',
  date = new Date(),
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${prefix}-${stamp}.${ext}`;
}

/** Trigger a browser download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Share a photo via the Web Share API when available (mobile/modern browsers).
 * Returns false when sharing files is not supported so callers can fall back.
 */
export async function sharePhoto(
  dataUrl: string,
  filename = buildFilename(),
): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  if (typeof navigator.share !== 'function') return false;

  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: blob.type });
  const data: ShareData = { files: [file], title: 'AirDeck photo' };
  if (nav.canShare && !nav.canShare(data)) return false;

  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}
