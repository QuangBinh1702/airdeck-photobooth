import {
  getAccessoryById,
  type AccessoryPlacement,
} from '@/features/photo/accessories';

export interface AccessoryDrawOptions {
  width: number;
  height: number;
  mirror?: boolean;
}

/**
 * Draw vector accessories onto a 2D context at their computed placements.
 *
 * For each placement we set up a transform where 1 unit == the accessory's
 * reference length in pixels, the origin is the anchor point, and the context
 * is rotated by the head roll. The accessory's vector `render` then draws in
 * that clean unit space. When the preview is mirrored (selfie), the whole space
 * is flipped on X so art lines up with the on-screen image.
 */
export function drawAccessories(
  ctx: CanvasRenderingContext2D,
  placements: AccessoryPlacement[],
  o: AccessoryDrawOptions,
): void {
  const { width: w, height: h, mirror = true } = o;
  for (const p of placements) {
    const accessory = getAccessoryById(p.id);
    if (!accessory) continue;

    const px = (mirror ? 1 - p.x : p.x) * w;
    const py = p.y * h;
    const unitPx = p.unit * w;
    if (unitPx <= 0) continue;

    ctx.save();
    ctx.translate(px, py);
    // Mirroring flips the visual roll direction.
    ctx.rotate(mirror ? -p.rotation : p.rotation);
    ctx.scale(unitPx, unitPx);
    accessory.render(ctx);
    ctx.restore();
  }
}
