import type { HandLandmarks } from '@/types/landmarks';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';

/** Connections between hand landmarks for drawing the skeleton. */
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];

export interface DrawOptions {
  width: number;
  height: number;
  /** Mirror X to match the selfie (mirrored) preview. */
  mirror?: boolean;
}

/** Map a normalized point to canvas pixels, honoring mirroring. */
function toPx(
  x: number,
  y: number,
  o: DrawOptions,
): [number, number] {
  const px = (o.mirror ? 1 - x : x) * o.width;
  const py = y * o.height;
  return [px, py];
}

/** Draw the 21-point hand skeleton. */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  hand: HandLandmarks,
  o: DrawOptions,
): void {
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(94,234,212,0.7)';
  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = hand[a];
    const pb = hand[b];
    if (!pa || !pb) continue;
    const [x1, y1] = toPx(pa.x, pa.y, o);
    const [x2, y2] = toPx(pb.x, pb.y, o);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const p of hand) {
    const [x, y] = toPx(p.x, p.y, o);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw a gesture shape overlay (triangle / star / circle / quad). */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeOverlay,
  o: DrawOptions,
): void {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(167,139,250,0.95)';
  ctx.fillStyle = 'rgba(167,139,250,0.18)';
  ctx.shadowColor = 'rgba(167,139,250,0.8)';
  ctx.shadowBlur = 18;

  if (shape.type === 'circle' && shape.center && shape.radius) {
    const [cx, cy] = toPx(shape.center.x, shape.center.y, o);
    // Use the average of width/height scale for the radius.
    const r = shape.radius * ((o.width + o.height) / 2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (shape.points.length >= 2) {
    ctx.beginPath();
    shape.points.forEach((p, i) => {
      const [x, y] = toPx(p.x, p.y, o);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Clear the whole canvas. */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  o: DrawOptions,
): void {
  ctx.clearRect(0, 0, o.width, o.height);
}
