import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  clearCanvas,
  drawHandSkeleton,
  drawShape,
  type DrawOptions,
} from '@/features/photo/drawOverlay';
import type { HandLandmarks } from '@/types/landmarks';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';

export interface OverlayHandle {
  /** Draw one frame: hand skeletons + the active gesture shape. */
  render: (hands: HandLandmarks[], shape: ShapeOverlay | null) => void;
  clear: () => void;
}

interface Props {
  showSkeleton?: boolean;
}

/**
 * A transparent canvas layered over the mirrored video. It is driven
 * imperatively (via ref) from the rAF gesture loop so React does not re-render
 * on every frame. The shape that follows the hand is the photobooth's
 * signature visual.
 */
export const OverlayCanvas = forwardRef<OverlayHandle, Props>(
  function OverlayCanvas({ showSkeleton = true }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      render(hands, shape) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) {
          // Keep the drawing buffer matched to the displayed size.
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const opts: DrawOptions = {
          width: canvas.width,
          height: canvas.height,
          mirror: true,
        };
        clearCanvas(ctx, opts);
        if (showSkeleton) {
          for (const hand of hands) drawHandSkeleton(ctx, hand, opts);
        }
        if (shape) drawShape(ctx, shape, opts);
      },
      clear() {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        data-testid="overlay-canvas"
      />
    );
  },
);
