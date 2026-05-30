import { useEffect, useRef } from 'react';
import { HandEngine } from '@/features/cv/handEngine';
import { GestureFsm } from '@/features/gestures/gestureFsm';
import { SwipeDetector } from '@/features/gestures/swipe';
import { detectPinch, getFingerStates } from '@/features/gestures/fingerState';
import {
  DEFAULT_GESTURE_MAP,
  mapGestureToIntent,
  type AppMode,
} from '@/features/gestures/gestureMapper';
import {
  classifyShutterGesture,
  type ShutterGestureId,
} from '@/features/photo/shutterGesture';
import { computeShapeOverlay } from '@/features/photo/gestureShapes';
import { FpsMeter } from '@/lib/adaptiveQuality';
import { useAppStore } from '@/store/appStore';
import type { GestureId, IntentType } from '@/types/gestures';
import type { HandLandmarks } from '@/types/landmarks';
import type { ShapeOverlay, ShapeType } from '@/features/photo/gestureShapes';

export interface GestureLoopHandlers {
  onIntent?: (intent: IntentType) => void;
  /** Fired (debounced) when a named photobooth shutter gesture is confirmed. */
  onShutterGesture?: (gesture: ShutterGestureId) => void;
  /** Fired (debounced) when a geometric shape gesture has been held steadily. */
  onShapeHold?: (shape: ShapeType) => void;
  /** Fired every processed frame with the raw hands + computed shape overlay. */
  onFrame?: (hands: HandLandmarks[], shape: ShapeOverlay | null) => void;
}

/**
 * Drives the real-time CV pipeline:
 *   video frame -> HandEngine -> (gesture + derived pinch/swipe)
 *   -> GestureFsm (debounce) -> gestureMapper -> intent
 *
 * Updates the store (fps, hands, current gesture) and emits intents.
 * The loop is paused automatically when the tab is hidden (battery saver).
 */
export function useGestureLoop(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
  handlers: GestureLoopHandlers = {},
) {
  const mode = useAppStore((s) => s.mode);
  const setEngineStatus = useAppStore((s) => s.setEngineStatus);
  const setFps = useAppStore((s) => s.setFps);
  const setHands = useAppStore((s) => s.setHandsDetected);
  const setGesture = useAppStore((s) => s.setCurrentGesture);
  const setShutterGesture = useAppStore((s) => s.setShutterGesture);
  const setError = useAppStore((s) => s.setError);

  // Keep latest mode/handlers in refs so the loop closure stays stable.
  const modeRef = useRef<AppMode>(mode);
  const handlersRef = useRef(handlers);
  modeRef.current = mode;
  handlersRef.current = handlers;

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let disposed = false;
    const engine = new HandEngine();
    const fsm = new GestureFsm({ holdFrames: 3, minScore: 0.6 });
    const shutterFsm = new GestureFsm({ holdFrames: 4, minScore: 0.9 });
    const shapeFsm = new GestureFsm({
      holdFrames: 6,
      minScore: 0.9,
      // Tolerate detection flicker: a brief shape dropout must NOT count as the
      // hand being lowered, otherwise the shape would re-fire repeatedly.
      releaseFrames: 8,
    });
    const swipe = new SwipeDetector();
    const fps = new FpsMeter();
    let lastVideoTime = -1;

    const emit = (gesture: GestureId) => {
      const intent = mapGestureToIntent(
        DEFAULT_GESTURE_MAP,
        modeRef.current,
        gesture,
      );
      if (intent) handlersRef.current.onIntent?.(intent);
    };

    // Debounce the geometric shape so holding it steadily fires once (which the
    // UI turns into a countdown + capture, like the reference photobooth).
    const processShapeHold = (shape: ShapeOverlay | null) => {
      const fired = shapeFsm.update(
        shape ? (shape.type as unknown as GestureId) : null,
        1,
      );
      if (fired) {
        handlersRef.current.onShapeHold?.(fired as unknown as ShapeType);
      }
    };

    // Returns the injected hands array when the dev/E2E hook is installed
    // (including an empty array = "hand lowered"), or `undefined` when no hook
    // is present so the real inference path runs instead.
    const readInjected = (): HandLandmarks[] | undefined => {
      const fn = (
        window as unknown as {
          __airdeckInjectHands?: () => HandLandmarks[] | null;
        }
      ).__airdeckInjectHands;
      if (!fn) return undefined;
      return fn() ?? [];
    };

    const tick = () => {
      if (disposed) return;
      const video = videoRef.current;
      const now = performance.now();
      const injected = readInjected();

      // Fast path: dev/E2E hook installed — drive the overlay/auto-capture from
      // synthetic hands (an empty array means the hand was lowered), even if the
      // model has not finished loading.
      if (injected !== undefined) {
        const shape = computeShapeOverlay(injected);
        setHands(injected.length);
        handlersRef.current.onFrame?.(injected, shape);
        processShapeHold(shape);
        raf = requestAnimationFrame(tick);
        return;
      }

      if (video && video.readyState >= 2 && engine.ready) {
        // Only run inference on new frames.
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const result = engine.detect(video, now);
            fps.sample(now);
            setFps(fps.fps);

            const hands = result.hands;
            setHands(hands.length);

            // Real-time gesture-driven shape overlay (triangle/star/circle/quad).
            const shape = computeShapeOverlay(hands);
            handlersRef.current.onFrame?.(hands, shape);
            processShapeHold(shape);

            const firstHand = hands[0];
            let gestureId: GestureId | null =
              result.gestures[0]?.id ?? null;
            const gestureScore = result.gestures[0]?.score ?? 0;

            // Derived gestures override "None" when applicable.
            if (firstHand) {
              const dir = swipe.push(firstHand, now);
              if (dir && modeRef.current === 'slides') {
                // Mirror: image-space right = user's left in selfie view.
                emit(dir === 'right' ? 'Swipe_Left' : 'Swipe_Right');
              }
              if (gestureId === 'None' || gestureId === null) {
                const pinch = detectPinch(firstHand);
                if (pinch.isPinching) gestureId = 'Pinch';
              }

              // Photobooth: classify the named hand sign from finger states and
              // fire a debounced shutter-gesture event.
              const states = getFingerStates(firstHand);
              const shutter = classifyShutterGesture(states);
              const firedShutter = shutterFsm.update(
                shutter === 'none' ? null : (shutter as unknown as GestureId),
                1,
              );
              setShutterGesture(
                (shutterFsm.current as unknown as ShutterGestureId) ?? 'none',
              );
              if (firedShutter) {
                handlersRef.current.onShutterGesture?.(
                  firedShutter as unknown as ShutterGestureId,
                );
              }
            } else {
              shutterFsm.update(null, 0);
              setShutterGesture('none');
            }

            const fired = fsm.update(gestureId, gestureScore);
            setGesture(fsm.current);
            if (fired) emit(fired);
          } catch (err) {
            setError((err as Error).message);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!disposed) {
        raf = requestAnimationFrame(tick);
      }
    };

    setEngineStatus('loading');
    // Start the rAF loop immediately so the injection fast-path (dev/E2E) works
    // even before the model finishes loading. Inference still waits for ready.
    raf = requestAnimationFrame(tick);
    engine
      .init(2)
      .then(() => {
        if (disposed) return;
        setEngineStatus('ready');
      })
      .catch((err: Error) => {
        if (disposed) return;
        setEngineStatus('error');
        setError(`Failed to load CV model: ${err.message}`);
      });

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.close();
      setEngineStatus('idle');
      setGesture(null);
      setShutterGesture('none');
    };
  }, [
    active,
    videoRef,
    setEngineStatus,
    setFps,
    setHands,
    setGesture,
    setShutterGesture,
    setError,
  ]);
}
