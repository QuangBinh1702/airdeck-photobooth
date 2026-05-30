import { useEffect, useRef } from 'react';
import { loadImage } from '@/features/photo/loadImage';
import { buildShapeClipPath } from '@/features/photo/composeShapeShot';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Frozen first shot used as the background. */
  backgroundUrl: string | null;
  /** Frozen shape (from shot 1) the live camera is clipped into. */
  shape: ShapeOverlay | null;
  active: boolean;
}

/**
 * Live "frame window" preview for the second shot of shape capture.
 *
 * Renders, every animation frame:
 *   - the frozen first shot as a full-frame background, and
 *   - the LIVE (mirrored) camera clipped to the frozen shape region,
 * so the user sees exactly what the second shot will look like — themselves
 * "inside the star/triangle/circle/quad" over the first photo.
 */
export function FrameWindowPreview({
  videoRef,
  backgroundUrl,
  shape,
  active,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !backgroundUrl || !shape) return;
    let raf = 0;
    let disposed = false;
    let bg: HTMLImageElement | null = null;

    loadImage(backgroundUrl)
      .then((img) => {
        bg = img;
      })
      .catch(() => {
        /* keep showing live-only if the bg fails to load */
      });

    const draw = () => {
      if (disposed) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const parent = canvas?.parentElement;
      if (canvas && parent) {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          // Background: the frozen first shot (already mirrored).
          if (bg) ctx.drawImage(bg, 0, 0, w, h);
          else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
          }
          // Live camera, clipped to the frozen shape (mirror to match preview).
          if (video && video.readyState >= 2) {
            ctx.save();
            buildShapeClipPath(ctx, shape, w, h, true);
            ctx.clip();
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, w, h);
            ctx.restore();
          }
          // Glowing outline so the window edge is obvious.
          ctx.save();
          buildShapeClipPath(ctx, shape, w, h, true);
          ctx.strokeStyle = 'rgba(255,255,255,0.95)';
          ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.008));
          ctx.shadowColor = 'rgba(167,139,250,0.9)';
          ctx.shadowBlur = 18;
          ctx.stroke();
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [active, backgroundUrl, shape, videoRef]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 h-full w-full"
      data-testid="frame-window-preview"
    />
  );
}
