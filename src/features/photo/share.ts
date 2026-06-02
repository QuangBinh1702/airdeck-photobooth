/**
 * Download/share helpers for captured images.
 *
 * Data URLs are kept for backwards compatibility, but user-initiated saving
 * should prefer Blob/File helpers so mobile browsers do not need to process a
 * very large base64 URL during download.
 */

export interface SaveImageOptions {
  filename?: string;
  type?: string;
  quality?: number;
  title?: string;
}

export type ShareBlobResult = 'shared' | 'unsupported' | 'cancelled' | 'failed';

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

/** Export a canvas to a Blob without creating a large base64 Data URL. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not export canvas'));
      },
      type,
      quality,
    );
  });
}

/** Trigger a browser download of a Blob URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Trigger a browser download of a data URL. Kept for compatibility only. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  downloadBlob(dataUrlToBlob(dataUrl), filename);
}

/**
 * Share a Blob via the Web Share API when available.
 * Distinguishes unsupported sharing from user cancellation so cancelling the
 * native share sheet does not unexpectedly trigger a download.
 */
export async function shareBlob(
  blob: Blob,
  filename: string,
  title = 'AirDeck photo',
): Promise<ShareBlobResult> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  if (typeof navigator.share !== 'function') return 'unsupported';

  const file = new File([blob], filename, { type: blob.type });
  if (nav.canShare && !nav.canShare({ files: [file] })) return 'unsupported';

  try {
    await navigator.share({ files: [file], title });
    return 'shared';
  } catch (err) {
    return (err as DOMException)?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/** Share first on capable mobile browsers, otherwise download. */
export async function saveBlob(
  blob: Blob,
  filename: string,
  title = 'AirDeck photo',
): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  const result = await shareBlob(blob, filename, title);
  if (result === 'shared' || result === 'cancelled' || result === 'failed') {
    return result;
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

/** Export a canvas and save/share it using the mobile-safe Blob flow. */
export async function saveCanvasImage(
  canvas: HTMLCanvasElement,
  options: SaveImageOptions = {},
): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  const type = options.type ?? 'image/jpeg';
  const quality = options.quality ?? 0.92;
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const filename = options.filename ?? buildFilename('airdeck', ext);
  const blob = await canvasToBlob(canvas, type, quality);
  return saveBlob(blob, filename, options.title ?? 'AirDeck photo');
}

/**
 * Share a photo via the Web Share API when available.
 * Returns false when sharing files is not supported so callers can fall back.
 */
export async function sharePhoto(
  dataUrl: string,
  filename = buildFilename(),
): Promise<boolean> {
  return (await shareBlob(dataUrlToBlob(dataUrl), filename)) === 'shared';
}
