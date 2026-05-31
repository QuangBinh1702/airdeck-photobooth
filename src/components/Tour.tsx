import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/appStore';
import { TOUR_STEPS } from '@/features/tour/tourSteps';
import { positionTooltip, type Rect } from '@/features/tour/tourPosition';

const PAD = 8; // spotlight padding around the target

export function Tour() {
  const tourActive = useAppStore((s) => s.tourActive);
  const tourStep = useAppStore((s) => s.tourStep);
  const next = useAppStore((s) => s.nextTourStep);
  const prev = useAppStore((s) => s.prevTourStep);
  const end = useAppStore((s) => s.endTour);

  const step = TOUR_STEPS[tourStep];
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tip, setTip] = useState<{ top: number; left: number; placement: string }>(
    { top: 0, left: 0, placement: 'center' },
  );

  // Measure the target element + position the tooltip. Recomputed on step
  // change, resize and scroll. Scrolls the target into view first.
  useLayoutEffect(() => {
    if (!tourActive || !step) return;

    let raf = 0;
    const measure = () => {
      const el = step.target
        ? document.querySelector<HTMLElement>(step.target)
        : null;
      let rect: Rect | null = null;
      // Treat hidden targets (e.g. inside a collapsed mobile section, where
      // offsetParent is null and the box is zero-sized) as "no target" so the
      // tooltip centers instead of spotlighting a broken 0×0 box at top-left.
      const visible = !!el && el.offsetParent !== null && el.offsetWidth > 0;
      if (el && visible) {
        const r = el.getBoundingClientRect();
        rect = {
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        };
      }
      setTargetRect(rect);
      const tipEl = tooltipRef.current;
      const size = tipEl
        ? { width: tipEl.offsetWidth, height: tipEl.offsetHeight }
        : { width: 320, height: 200 };
      setTip(
        positionTooltip(
          rect,
          size,
          { width: window.innerWidth, height: window.innerHeight },
          step.placement ?? 'bottom',
        ),
      );
    };

    // Bring the target into view, then measure on the next frame.
    if (step.target) {
      document
        .querySelector(step.target)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    raf = requestAnimationFrame(() => {
      // A second pass after layout settles (tooltip size known).
      measure();
      requestAnimationFrame(measure);
    });

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [tourActive, tourStep, step]);

  // Keyboard navigation.
  useEffect(() => {
    if (!tourActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourActive, next, prev, end]);

  if (!tourActive || !step) return null;

  const isLast = tourStep === TOUR_STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Hướng dẫn">
      {/* Backdrop + spotlight. When there's a target, a transparent box with a
          giant shadow darkens everything except the target. */}
      {targetRect ? (
        <div
          className="pointer-events-none absolute rounded-xl animate-spot-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
          data-testid="tour-spotlight"
        />
      ) : (
        <div className="absolute inset-0 bg-black/72" />
      )}

      {/* Click-catcher to dismiss on backdrop click (kept under the tooltip). */}
      <button
        type="button"
        aria-label="Đóng hướng dẫn"
        onClick={end}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute w-[min(92vw,360px)] animate-tour-in rounded-2xl border border-white/10 bg-panel p-4 shadow-2xl"
        style={{ top: tip.top, left: tip.left }}
        data-testid="tour-tooltip"
      >
        {step.image && (
          <img
            src={step.image}
            alt=""
            className="mb-3 max-h-44 w-full rounded-lg object-contain"
            data-testid="tour-image"
          />
        )}
        <h3 className="text-base font-semibold text-white">{step.title}</h3>
        <p className="mt-1 text-sm text-white/65">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {TOUR_STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === tourStep ? 'w-5 bg-accent' : 'w-1.5 bg-white/25'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={end}
              className="text-xs text-white/45 hover:text-white/70"
              data-testid="tour-skip"
            >
              Bỏ qua
            </button>
            {tourStep > 0 && (
              <button
                type="button"
                onClick={prev}
                className="btn-ghost px-3 py-1.5 text-sm"
                data-testid="tour-prev"
              >
                Trước
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="btn-primary px-4 py-1.5 text-sm"
              data-testid="tour-next"
            >
              {isLast ? 'Xong' : 'Tiếp'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
