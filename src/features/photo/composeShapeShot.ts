import type { ShapeOverlay } from '@/features/photo/gestureShapes';

/**
 * Two-shot "frame window" composite for shape mode:
 *   - `background` is drawn full-frame (the first shot).
 *   - `inset` (the second shot) is drawn clipped to the geometric shape, so it
 *     appears *inside* the triangle/star/circle/quad the user framed — like
 *     looking through the shape at a different moment.
 *
 * Both source images are assumed to already be mirrored (as produced by
 * `capturePhoto({ mirror: true })`), so the shape's normalized coordinates are
 * mirrored here too to line up with the pixels.
 */

export interface ShapeShotOptions {
  mirror?: boolean;
  type?: string;
  quality?: number;
}

/** Build the shape outline as a path on the context (does not stroke/fill). */
export function buildShapeClipPath(
  ctx: CanvasRenderingContext2D,
  shape: ShapeOverlay,
  w: number,
  h: number,
  mirror = true,
): void {
  const toPx = (x: number, y: number): [number, number] => [
    (mirror ? 1 - x : x) * w,
    y * h,
  ];
  ctx.beginPath();
  if (shape.type === 'circle' && shape.center && shape.radius) {
    const [cx, cy] = toPx(shape.center.x, shape.center.y);
    const r = shape.radius * ((w + h) / 2);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else {
    shape.points.forEach((p, i) => {
      const [x, y] = toPx(p.x, p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}

/**
 * Compose the background + the shape-clipped inset and return a data URL.
 * Returns null when dimensions are unavailable or the 2D context is missing.
 */
export function composeShapeShot(
  background: HTMLImageElement,
  inset: HTMLImageElement,
  canvas: HTMLCanvasElement,
  shape: ShapeOverlay,
  options: ShapeShotOptions = {},
): string | null {
  const { mirror = true, type = 'image/png', quality } = options;
  const w = background.naturalWidth || background.width;
  const h = background.naturalHeight || background.height;
  if (!w || !h) return null;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1) Background fills the frame.
  ctx.drawImage(background, 0, 0, w, h);

  // 2) Inset, clipped to the shape region.
  ctx.save();
  buildShapeClipPath(ctx, shape, w, h, mirror);
  ctx.clip();
  ctx.drawImage(inset, 0, 0, w, h);
  ctx.restore();

  // 3) Outline so the window edge reads clearly.
  ctx.save();
  buildShapeClipPath(ctx, shape, w, h, mirror);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.006));
  ctx.shadowColor = 'rgba(167,139,250,0.9)';
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL(type, quality);
}
