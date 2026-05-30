import { computeFrameMetrics, getFrameById, type FrameSpec } from './frames';

/**
 * Draw a CSS-style background (solid or simple linear-gradient) onto a 2D ctx.
 * Supports the limited gradient syntax used by FRAMES:
 *   "linear-gradient(135deg,#aaa,#bbb)".
 */
export function paintBackground(
  ctx: CanvasRenderingContext2D,
  background: string,
  w: number,
  h: number,
): void {
  if (background === 'transparent') return;
  if (background.startsWith('linear-gradient')) {
    const stops = background
      .slice(background.indexOf('(') + 1, background.lastIndexOf(')'))
      .split(',')
      .map((s) => s.trim());
    // First token is the angle (ignored — we use a diagonal gradient).
    const colors = stops.slice(1);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    colors.forEach((c, i) => {
      grad.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c);
    });
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = background;
  }
  ctx.fillRect(0, 0, w, h);
}

export interface ComposeOptions {
  caption?: string;
  type?: string;
  quality?: number;
}

/**
 * Compose a source image (data URL or HTMLImageElement) into a decorative
 * frame and return the resulting data URL. Returns null if the 2D context is
 * unavailable.
 */
export function composeFramedPhoto(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  frameId: string,
  options: ComposeOptions = {},
): string | null {
  const frame = getFrameById(frameId);
  const pw = image.naturalWidth || image.width;
  const ph = image.naturalHeight || image.height;
  if (!pw || !ph) return null;

  const metrics = computeFrameMetrics(frame, pw, ph);
  canvas.width = metrics.outerWidth;
  canvas.height = metrics.outerHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Frame background fills the whole canvas.
  paintBackground(ctx, frame.background, canvas.width, canvas.height);

  // Photo.
  ctx.drawImage(
    image,
    metrics.photo.x,
    metrics.photo.y,
    metrics.photo.width,
    metrics.photo.height,
  );

  // Inner accent border line around the photo.
  if (frame.borderRatio > 0 && frame.accent !== 'transparent') {
    ctx.strokeStyle = frame.accent;
    ctx.lineWidth = Math.max(1, metrics.border * 0.15);
    ctx.strokeRect(
      metrics.photo.x,
      metrics.photo.y,
      metrics.photo.width,
      metrics.photo.height,
    );
  }

  // Caption in the footer area.
  const caption = options.caption ?? frame.caption;
  if (metrics.footer > 0 && caption) {
    ctx.fillStyle = frame.captionColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.round(metrics.footer * 0.4);
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    const cx = canvas.width / 2;
    const cy =
      metrics.photo.y + metrics.photo.height + metrics.border + metrics.footer / 2;
    ctx.fillText(caption, cx, cy);
  }

  return canvas.toDataURL(options.type ?? 'image/png', options.quality);
}

export type { FrameSpec };
