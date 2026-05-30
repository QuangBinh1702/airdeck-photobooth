import { drawShape, type DrawOptions } from '@/features/photo/drawOverlay';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';

/**
 * Composite a video frame (with an optional CSS-style filter and mirroring)
 * onto a canvas and return a data URL. Returns null when the canvas 2D context
 * is unavailable or the video has no dimensions yet.
 */
export function capturePhoto(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  filterCss = 'none',
  options: {
    mirror?: boolean;
    type?: string;
    quality?: number;
    overlayShape?: ShapeOverlay | null;
  } = {},
): string | null {
  const { mirror = true, type = 'image/png', quality, overlayShape } = options;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  // Match the on-screen mirrored selfie preview.
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  if (filterCss && filterCss !== 'none') {
    ctx.filter = filterCss;
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  // Draw the active gesture shape on top (unmirrored space; drawShape mirrors).
  if (overlayShape) {
    const opts: DrawOptions = { width: w, height: h, mirror };
    drawShape(ctx, overlayShape, opts);
  }

  return canvas.toDataURL(type, quality);
}
