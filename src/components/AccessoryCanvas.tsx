import { forwardRef, useImperativeHandle, useRef } from 'react';
import { drawAccessories } from '@/features/photo/drawAccessories';
import type { AccessoryPlacement } from '@/features/photo/accessories';

export interface AccessoryHandle {
  render: (placements: AccessoryPlacement[]) => void;
  clear: () => void;
}

/**
 * Transparent canvas over the mirrored video that draws face accessory emoji.
 * Driven imperatively (via ref) from the face loop so React doesn't re-render
 * each frame.
 */
export const AccessoryCanvas = forwardRef<AccessoryHandle>(
  function AccessoryCanvas(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      render(placements) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) {
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAccessories(ctx, placements, {
          width: canvas.width,
          height: canvas.height,
          mirror: true,
        });
      },
      clear() {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        data-testid="accessory-canvas"
      />
    );
  },
);
