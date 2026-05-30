import { drawShape, type DrawOptions } from '@/features/photo/drawOverlay';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';
import { enhanceImageData } from '@/features/photo/enhance';

export interface CaptureOptions {
  mirror?: boolean;
  type?: string;
  quality?: number;
  overlayShape?: ShapeOverlay | null;
  /** Auto-enhance lighting (white balance + contrast). Default true. */
  enhance?: boolean;
  /**
   * Optional high-resolution still (from ImageCapture). When provided it is
   * drawn instead of the video frame, giving the camera's full sensor quality.
   */
  source?: CanvasImageSource;
  sourceWidth?: number;
  sourceHeight?: number;
}

/**
 * Composite a video frame (or a high-res still) onto a canvas, optionally
 * mirrored, filtered, auto-enhanced, and with a gesture shape on top. Returns a
 * data URL, or null when the canvas 2D context or dimensions are unavailable.
 *
 * Quality defaults to PNG (lossless). Pass `type: 'image/jpeg', quality: 0.95`
 * for smaller files.
 */
export function capturePhoto(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  filterCss = 'none',
  options: CaptureOptions = {},
): string | null {
  const {
    mirror = true,
    type = 'image/png',
    quality,
    overlayShape,
    enhance = true,
    source,
    sourceWidth,
    sourceHeight,
  } = options;

  // Prefer the high-res still source when given; otherwise the live video.
  const drawSource: CanvasImageSource = source ?? video;
  const w = source ? (sourceWidth ?? 0) : video.videoWidth;
  const h = source ? (sourceHeight ?? 0) : video.videoHeight;
  if (!w || !h) return null;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  if (filterCss && filterCss !== 'none') {
    ctx.filter = filterCss;
  }
  ctx.drawImage(drawSource, 0, 0, w, h);
  ctx.restore();

  // Auto-enhance lighting on the photo pixels (before the decorative overlay so
  // the shape's clean colours aren't altered).
  if (enhance) {
    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      enhanceImageData(imageData, { strength: 0.6 });
      ctx.putImageData(imageData, 0, 0);
    } catch {
      /* getImageData can throw on tainted canvases; skip enhancement then */
    }
  }

  if (overlayShape) {
    const opts: DrawOptions = { width: w, height: h, mirror };
    drawShape(ctx, overlayShape, opts);
  }

  return canvas.toDataURL(type, quality);
}
