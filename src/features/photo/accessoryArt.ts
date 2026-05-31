/**
 * Vector art for face accessories, drawn in a normalized "unit" space so they
 * scale/rotate with the face and stay crisp (unlike emoji).
 *
 * Unit-space contract for every render function:
 *   - the context is already translated to the accessory's anchor, rotated by
 *     the head roll, and scaled so that 1 unit == the reference length
 *     (eye distance for eye/nose/mouth accessories, face width for hats).
 *   - +x points along the eye line (subject's right→left in mirrored view),
 *     +y points down. Origin (0,0) is the anchor point.
 *
 * Each function draws a centered accessory using paths/gradients only.
 */

type Ctx = CanvasRenderingContext2D;

/** Rounded-rectangle path helper (radius clamped to half the smaller side). */
function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function lens(
  ctx: Ctx,
  cx: number,
  tint: string | null,
  stroke: string,
): void {
  const w = 0.52;
  const h = 0.42;
  roundRect(ctx, cx - w / 2, -h / 2, w, h, 0.18);
  if (tint) {
    const g = ctx.createLinearGradient(cx - w / 2, -h / 2, cx + w / 2, h / 2);
    g.addColorStop(0, tint);
    g.addColorStop(1, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.lineWidth = 0.045;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

/** Eyeglasses: two rounded lenses centered on the eyes, a bridge and temples. */
export function drawGlasses(ctx: Ctx, opts: { tint?: string | null; frame?: string }): void {
  const frame = opts.frame ?? '#222';
  const tint = opts.tint ?? null;
  // Lens center sits roughly over each pupil (~0.33 of the eye-corner span).
  const cx = 0.33;
  const lensHalf = 0.26; // half lens width (must match `w/2` in lens())
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Lenses (mirror left/right).
  lens(ctx, -cx, tint, frame);
  lens(ctx, cx, tint, frame);
  // Bridge: short gentle arch joining the inner edges of the two lenses.
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = frame;
  ctx.beginPath();
  ctx.moveTo(-cx + lensHalf, -0.05);
  ctx.quadraticCurveTo(0, -0.11, cx - lensHalf, -0.05);
  ctx.stroke();
  // Temples (arms) angling back toward the ears from the outer lens edges.
  ctx.lineWidth = 0.045;
  ctx.beginPath();
  ctx.moveTo(-cx - lensHalf, -0.06);
  ctx.lineTo(-0.95, -0.16);
  ctx.moveTo(cx + lensHalf, -0.06);
  ctx.lineTo(0.95, -0.16);
  ctx.stroke();
}

/** A classic top hat sitting above the head (ref = face width). */
export function drawTopHat(ctx: Ctx): void {
  ctx.fillStyle = '#15151a';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.02;
  // Brim.
  roundRect(ctx, -0.62, -0.06, 1.24, 0.16, 0.08);
  ctx.fill();
  // Crown.
  roundRect(ctx, -0.34, -0.72, 0.68, 0.7, 0.06);
  ctx.fill();
  // Band.
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-0.34, -0.2, 0.68, 0.12);
}

/** A jagged five-point crown above the head (ref = face width). */
export function drawCrown(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, -0.6, 0, 0);
  g.addColorStop(0, '#fde68a');
  g.addColorStop(1, '#f59e0b');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(-0.5, 0);
  ctx.lineTo(-0.5, -0.35);
  ctx.lineTo(-0.25, -0.12);
  ctx.lineTo(0, -0.5);
  ctx.lineTo(0.25, -0.12);
  ctx.lineTo(0.5, -0.35);
  ctx.lineTo(0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Gems.
  for (const [gx, gy, c] of [
    [0, -0.16, '#ef4444'],
    [-0.3, -0.04, '#3b82f6'],
    [0.3, -0.04, '#22c55e'],
  ] as const) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(gx, gy, 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Bunny ears above the head (ref = face width). */
export function drawBunnyEars(ctx: Ctx): void {
  const ear = (sign: number) => {
    ctx.save();
    ctx.translate(sign * 0.28, 0);
    ctx.rotate(sign * 0.18);
    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 0.02;
    roundRect(ctx, -0.12, -0.95, 0.24, 0.95, 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f9a8d4';
    roundRect(ctx, -0.06, -0.85, 0.12, 0.7, 0.06);
    ctx.fill();
    ctx.restore();
  };
  ear(-1);
  ear(1);
}

/** Cat ears above the head (ref = face width). */
export function drawCatEars(ctx: Ctx): void {
  const ear = (sign: number) => {
    ctx.fillStyle = '#3f3f46';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(sign * 0.18, 0);
    ctx.lineTo(sign * 0.42, -0.5);
    ctx.lineTo(sign * 0.62, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.moveTo(sign * 0.28, -0.05);
    ctx.lineTo(sign * 0.42, -0.34);
    ctx.lineTo(sign * 0.52, -0.05);
    ctx.closePath();
    ctx.fill();
  };
  ear(-1);
  ear(1);
}

/** A curly mustache centered under the nose (ref = eye distance). */
export function drawMustache(ctx: Ctx): void {
  ctx.fillStyle = '#2b1b10';
  const half = (sign: number) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      sign * 0.15,
      -0.14,
      sign * 0.5,
      -0.16,
      sign * 0.6,
      0.02,
    );
    ctx.bezierCurveTo(
      sign * 0.52,
      -0.04,
      sign * 0.3,
      0.02,
      sign * 0.16,
      0.12,
    );
    ctx.bezierCurveTo(sign * 0.1, 0.14, sign * 0.04, 0.12, 0, 0.06);
    ctx.closePath();
    ctx.fill();
  };
  half(-1);
  half(1);
}

/** A red clown nose (ref = eye distance), centered on the nose tip. */
export function drawClownNose(ctx: Ctx): void {
  const g = ctx.createRadialGradient(-0.05, -0.05, 0.02, 0, 0, 0.22);
  g.addColorStop(0, '#ff6b6b');
  g.addColorStop(1, '#c81e1e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-0.06, -0.06, 0.05, 0, Math.PI * 2);
  ctx.fill();
}
