import { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '@/features/camera/useCamera';
import { useAppStore } from '@/store/appStore';
import { FILTERS, getFilterById } from '@/features/photo/filters';
import { getFrameById } from '@/features/photo/frames';
import { capturePhoto } from '@/features/photo/capture';
import { composeShapeShot } from '@/features/photo/composeShapeShot';
import { loadImage } from '@/features/photo/loadImage';
import { useGestureLoop } from '@/features/cv/useGestureLoop';
import { Countdown } from '@/features/photo/countdown';
import { getShutterGesture } from '@/features/photo/shutterGesture';
import { PhotoControls } from '@/components/PhotoControls';
import { Gallery } from '@/components/Gallery';
import { FramedPreview } from '@/components/FramedPreview';
import { OverlayCanvas, type OverlayHandle } from '@/components/OverlayCanvas';
import { FrameWindowPreview } from '@/components/FrameWindowPreview';
import { StripMaker } from '@/components/StripMaker';

export function StudioView() {
  const { videoRef, status, error, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setCameraStatus = useAppStore((s) => s.setCameraStatus);
  const filterId = useAppStore((s) => s.filterId);
  const setFilterId = useAppStore((s) => s.setFilterId);
  const captureMode = useAppStore((s) => s.captureMode);
  const shutterGesture = useAppStore((s) => s.shutterGesture);
  const addPhoto = useAppStore((s) => s.addPhoto);

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [cooling, setCooling] = useState(false);
  // Two-shot "frame window" flow hint (shape mode): tells the user which shot.
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  // During shot 2 of the frame-window flow, show a live preview: frozen shot 1
  // as background + live camera clipped into the frozen shape.
  const [frameWindow, setFrameWindow] = useState<{
    backgroundUrl: string;
    shape: import('@/features/photo/gestureShapes').ShapeOverlay;
  } | null>(null);

  const countdownRef = useRef(new Countdown(3));
  const filterRef = useRef(filterId);
  filterRef.current = filterId;
  const overlayRef = useRef<OverlayHandle>(null);
  const shapeLabelRef = useRef<string | null>(null);
  // Auto-capture gate: after an auto (gesture/shape) shot, block the next auto
  // shot until the user lowers their hand AND a short cooldown elapses. This
  // stops machine-gun captures while a shape/sign is held (or flickers).
  const autoLockedRef = useRef(false);
  const busyRef = useRef(false);
  // Synchronous cooldown gate (the `cooling` state is only for the UI hint and
  // can be stale inside the rAF callbacks, so we gate on this ref instead).
  const coolingRef = useRef(false);
  const cooldownTimerRef = useRef<number | null>(null);
  const lastFrameRef = useRef<{
    hands: import('@/types/landmarks').HandLandmarks[];
    shape: import('@/features/photo/gestureShapes').ShapeOverlay | null;
  }>({ hands: [], shape: null });

  useEffect(() => {
    setCameraStatus(status);
  }, [status, setCameraStatus]);

  // Clear any pending cooldown timer on unmount.
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const filter = getFilterById(filterId);

  // Capture the current video frame as a raw data URL (filtered + mirrored),
  // with an optional shape overlay baked in.
  const grabFrame = useCallback(
    (overlayShape: import('@/features/photo/gestureShapes').ShapeOverlay | null) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return null;
      return capturePhoto(
        video,
        canvas,
        getFilterById(filterRef.current).css,
        { mirror: true, overlayShape },
      );
    },
    [videoRef],
  );

  const flashAndToast = useCallback(() => {
    setFlash(true);
    setJustSaved(true);
    window.setTimeout(() => setFlash(false), 220);
    window.setTimeout(() => setJustSaved(false), 1400);
  }, []);

  // Begin the post-capture cooldown (blocks the next auto shot for a moment).
  const beginCooldown = useCallback(() => {
    coolingRef.current = true;
    setCooling(true);
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = window.setTimeout(() => {
      coolingRef.current = false;
      setCooling(false);
    }, 2000);
  }, []);

  // Run a self-timer countdown, then invoke `onDone`. Drives the on-screen
  // countdown number; if the timer is 0 it fires immediately.
  const runCountdown = useCallback((onDone: () => void) => {
    const seconds = useAppStore.getState().timer;
    if (seconds === 0) {
      onDone();
      return;
    }
    const cd = new Countdown(seconds);
    countdownRef.current = cd;
    cd.start(performance.now());
    const step = () => {
      const state = cd.tick(performance.now());
      setCountdownValue(state.running ? state.secondsLeft : null);
      if (state.justFinished) {
        onDone();
        return;
      }
      if (state.running) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  // Release the busy lock + start cooldown after a capture flow completes.
  const finishAfterCapture = useCallback(() => {
    busyRef.current = false;
    beginCooldown();
  }, [beginCooldown]);

  // Single-shot capture (gesture mode, or shape mode with no active shape).
  const captureSingle = useCallback(() => {
    const mode = useAppStore.getState().captureMode;
    const url = grabFrame(
      mode === 'shape' ? lastFrameRef.current.shape : null,
    );
    if (url) {
      addPhoto(url);
      flashAndToast();
    }
  }, [grabFrame, addPhoto, flashAndToast]);

  // Two-shot "frame window": shot 1 = background, shot 2 = clipped inside the
  // shape. Produces one composite image (the reference photobooth look).
  // The shape is read at the moment shot 1 is taken (end of the countdown), not
  // when the gesture was first detected, so it matches the final hand pose.
  const captureFrameWindow = useCallback(() => {
    // Freeze the shape AS IT IS RIGHT NOW (countdown just finished).
    const shape = lastFrameRef.current.shape;
    // Shot 1 — background (raw, no overlay).
    const bgUrl = grabFrame(null);
    flashAndToast();

    if (!bgUrl || !shape) {
      // No valid shape at capture time -> just save the single background.
      if (bgUrl) addPhoto(bgUrl);
      setCountdownValue(null);
      finishAfterCapture();
      return;
    }

    // Enter shot-2 phase: show the live frame-window preview (frozen bg + live
    // camera clipped to the frozen shape) so the user sees exactly how they
    // appear "inside" the shape before the second shot is taken.
    setFrameWindow({ backgroundUrl: bgUrl, shape });
    setPhaseHint('Tạo dáng trong khung — chụp lớp trong…');

    // Brief pause, then countdown to shot 2.
    window.setTimeout(() => {
      runCountdown(() => {
        const insetUrl = grabFrame(null);
        setPhaseHint(null);
        setCountdownValue(null);
        setFrameWindow(null);
        if (!insetUrl) {
          addPhoto(bgUrl);
          finishAfterCapture();
          return;
        }
        // Compose background + shape-clipped inset off-screen.
        Promise.all([loadImage(bgUrl), loadImage(insetUrl)])
          .then(([bg, inset]) => {
            const composeCanvas = document.createElement('canvas');
            const composed = composeShapeShot(bg, inset, composeCanvas, shape, {
              // Sources are mirrored (selfie); mirror the shape coords too so
              // the clip region lines up with where the hands framed it.
              mirror: true,
            });
            addPhoto(composed ?? bgUrl);
            flashAndToast();
          })
          .catch(() => addPhoto(bgUrl))
          .finally(() => finishAfterCapture());
      });
    }, 1200);
  }, [grabFrame, addPhoto, flashAndToast, runCountdown, finishAfterCapture]);

  // Entry point. `auto` = triggered by a held gesture/shape (gated by the
  // auto-lock + cooldown); manual button/Space pass auto=false.
  const startCountdown = useCallback(
    (auto = false) => {
      if (status !== 'ready') return;
      if (busyRef.current) return; // a flow is already running
      if (auto && autoLockedRef.current) return; // wait for hand-down + cooldown
      if (auto && coolingRef.current) return; // still cooling down

      busyRef.current = true;
      if (auto) autoLockedRef.current = true;

      const mode = useAppStore.getState().captureMode;

      // Shape mode => two-shot frame-window flow. The shape is re-read at the
      // moment shot 1 is captured (end of countdown), so it reflects the final
      // hand pose, not the pose when the gesture was first detected.
      if (mode === 'shape') {
        runCountdown(() => captureFrameWindow());
        return;
      }

      // Otherwise a normal single capture.
      runCountdown(() => {
        captureSingle();
        setCountdownValue(null);
        finishAfterCapture();
      });
    },
    [status, runCountdown, captureFrameWindow, captureSingle, finishAfterCapture],
  );

  // Keyboard fallback: Space to capture (always allowed, manual).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && status === 'ready') {
        e.preventDefault();
        startCountdown(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, startCountdown]);

  useGestureLoop(videoRef, status === 'ready', {
    onShutterGesture: () => {
      // Auto-capture by hand sign only in 'gesture' mode (no shape overlap).
      if (useAppStore.getState().captureMode === 'gesture') startCountdown(true);
    },
    onShapeHold: () => {
      // Auto-capture by geometric shape only in 'shape' mode: holding a valid
      // shape steadily starts the countdown, then captures (shape baked in).
      if (useAppStore.getState().captureMode === 'shape') startCountdown(true);
    },
    onFrame: (hands, shape) => {
      // Shapes are a 'shape'-mode concept; suppress them in 'gesture' mode so
      // the two capture styles never conflict.
      const shapeMode = useAppStore.getState().captureMode === 'shape';
      const effectiveShape = shapeMode ? shape : null;
      lastFrameRef.current = { hands, shape: effectiveShape };
      overlayRef.current?.render(hands, effectiveShape);

      // Re-arm auto-capture once the hand is lowered (no hand / no shape & no
      // recognized sign), so the user must "reset" between auto shots. Do not
      // re-arm while a countdown is running or during the cooldown window.
      const handDown =
        hands.length === 0 ||
        (shapeMode
          ? effectiveShape === null
          : useAppStore.getState().shutterGesture === 'none');
      if (handDown && !busyRef.current && !coolingRef.current) {
        autoLockedRef.current = false;
      }

      const label = effectiveShape
        ? `${effectiveShape.emoji} ${effectiveShape.label}`
        : null;
      // Only push to React state when the label actually changes (avoid churn).
      if (label !== shapeLabelRef.current) {
        shapeLabelRef.current = label;
        setActiveShape(label);
      }
    },
  });

  const heldGesture = getShutterGesture(shutterGesture);
  const frameId = useAppStore((s) => s.frameId);
  const frame = getFrameById(frameId);
  const showLiveFrame = frame.id !== 'none';

  return (
    <div className="space-y-5">
      {/* Live frame: the selected frame wraps the stage so you preview the look */}
      <div
        className="rounded-2xl shadow-2xl"
        style={
          showLiveFrame
            ? { background: frame.background, padding: 'clamp(10px,2.5%,28px)' }
            : undefined
        }
        data-testid="live-frame"
      >
        <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
            style={{ filter: filter.css }}
            data-testid="camera-video"
          />
        <canvas
          ref={canvasRef}
          className="hidden"
          data-testid="capture-canvas"
        />

        {/* Gesture-driven shape overlay (follows the hand in real time).
            Hidden during the frame-window 2nd-shot preview. */}
        {status === 'ready' && frameWindow === null && (
          <OverlayCanvas ref={overlayRef} />
        )}

        {/* Frame-window live preview (2nd shot): frozen bg + live camera in shape */}
        <FrameWindowPreview
          videoRef={videoRef}
          backgroundUrl={frameWindow?.backgroundUrl ?? null}
          shape={frameWindow?.shape ?? null}
          active={frameWindow !== null}
        />

        {/* Active shape badge */}
        {status === 'ready' && activeShape && (
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-accent2/90 px-4 py-1.5 text-sm font-semibold text-ink shadow-lg">
            {activeShape}
          </div>
        )}

        {/* Cooldown hint: tells the user to lower their hand before next shot */}
        {status === 'ready' && cooling && countdownValue === null && (
          <div
            className="absolute bottom-3 right-3 z-20 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/85 backdrop-blur"
            data-testid="cooldown-hint"
          >
            ✋ Hạ tay xuống để chụp tiếp
          </div>
        )}

        {/* Flash on capture */}
        {flash && (
          <div className="pointer-events-none absolute inset-0 z-30 bg-white animate-[pulse-ring_0.2s_ease-out]" />
        )}

        {/* Held-gesture badge (gesture-capture mode only) */}
        {status === 'ready' && heldGesture && captureMode === 'gesture' && (
          <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur">
            <span className="text-lg" aria-hidden>
              {heldGesture.emoji}
            </span>
            <span className="text-xs font-medium text-white/90">
              {heldGesture.label}
            </span>
          </div>
        )}

        {/* "Saved!" toast */}
        {justSaved && (
          <div
            className="absolute right-3 top-3 z-20 rounded-full bg-accent/90 px-3 py-1.5 text-xs font-semibold text-ink"
            data-testid="saved-toast"
          >
            ✓ Đã lưu ảnh!
          </div>
        )}

        {/* Countdown */}
        {countdownValue !== null && (
          <div
            className="absolute inset-0 z-20 grid place-items-center bg-black/30"
            data-testid="countdown"
            aria-live="assertive"
          >
            <span className="text-[9rem] font-black leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
              {countdownValue}
            </span>
          </div>
        )}

        {/* Two-shot frame-window phase hint */}
        {phaseHint !== null && (
          <div
            className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-accent2/90 px-4 py-1.5 text-sm font-semibold text-ink shadow-lg"
            data-testid="phase-hint"
          >
            {phaseHint}
          </div>
        )}

        {/* Camera-off / error overlay */}
        {status !== 'ready' && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/65 p-6 text-center backdrop-blur-sm">
            <div className="max-w-sm space-y-4">
              <div className="text-5xl" aria-hidden>
                {status === 'denied' || status === 'no-device' ? '🚫' : '📷'}
              </div>
              <p className="text-white/85" data-testid="camera-message">
                {status === 'idle' && 'Camera đang tắt. Bật để bắt đầu chụp.'}
                {status === 'requesting' && 'Đang xin quyền camera…'}
                {status === 'denied' &&
                  'Quyền camera bị từ chối. Hãy bật lại trong cài đặt trình duyệt.'}
                {status === 'no-device' && 'Không tìm thấy thiết bị camera.'}
                {status === 'error' && (error ?? 'Lỗi camera.')}
              </p>
              {status !== 'requesting' && (
                <button
                  type="button"
                  onClick={start}
                  className="btn-primary"
                  data-testid="start-camera"
                >
                  Bật camera
                </button>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Caption under the live frame (matches the printed strip look) */}
        {showLiveFrame && frame.caption && (
          <p
            className="py-2 text-center text-sm font-semibold"
            style={{ color: frame.captionColor }}
          >
            {frame.caption}
          </p>
        )}
      </div>

      {/* Shutter row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => startCountdown(false)}
          disabled={status !== 'ready'}
          className="btn-primary text-base"
          data-testid="capture-btn"
        >
          📸 Chụp ảnh
        </button>
        {status === 'ready' && (
          <button type="button" onClick={stop} className="btn-ghost">
            Dừng camera
          </button>
        )}
        <span className="text-xs text-white/40">
          {captureMode === 'shape'
            ? 'Giữ hình để tự chụp (hạ tay rồi tạo lại để chụp tiếp), hoặc bấm Chụp / Space bất cứ lúc nào'
            : 'Giữ cử chỉ (✌️ 👍 🖐️) để tự chụp (hạ tay để chụp tiếp), hoặc bấm Chụp / Space'}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterId(f.id)}
              aria-pressed={filterId === f.id}
              className={`chip ${filterId === f.id ? 'chip-on' : 'chip-off'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <PhotoControls />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Gallery />
        <FramedPreview />
      </div>

      <StripMaker />
    </div>
  );
}
