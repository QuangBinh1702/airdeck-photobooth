import { useEffect, useRef } from 'react';
import { FaceEngine } from '@/features/cv/faceEngine';
import { computeFaceAnchors } from '@/features/photo/faceAnchors';
import {
  getAccessoryById,
  placeAccessory,
  type AccessoryPlacement,
} from '@/features/photo/accessories';
import { useAppStore } from '@/store/appStore';

/**
 * Runs MediaPipe FaceLandmarker on the video and reports accessory placements
 * (one per selected accessory, per detected face) every processed frame.
 *
 * Only active when at least one accessory is selected, so the face model isn't
 * loaded unnecessarily. Pauses with the tab (battery saver) like the gesture
 * loop.
 */
export function useFaceLoop(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
  onPlacements: (placements: AccessoryPlacement[]) => void,
) {
  const accessoryIds = useAppStore((s) => s.accessoryIds);
  const accessoryIdsRef = useRef(accessoryIds);
  accessoryIdsRef.current = accessoryIds;
  const onPlacementsRef = useRef(onPlacements);
  onPlacementsRef.current = onPlacements;

  // Whether any accessory is selected (drives whether we run the model at all).
  const hasAccessories = accessoryIds.length > 0;

  useEffect(() => {
    if (!active || !hasAccessories) {
      onPlacementsRef.current([]);
      return;
    }

    let raf = 0;
    let disposed = false;
    const engine = new FaceEngine();
    let lastVideoTime = -1;

    const tick = () => {
      if (disposed) return;
      const video = videoRef.current;
      const now = performance.now();
      if (video && video.readyState >= 2 && engine.ready) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const faces = engine.detect(video, now);
            const placements: AccessoryPlacement[] = [];
            for (const face of faces) {
              const anchors = computeFaceAnchors(face);
              if (!anchors) continue;
              for (const id of accessoryIdsRef.current) {
                const acc = getAccessoryById(id);
                if (acc) placements.push(placeAccessory(acc, anchors));
              }
            }
            onPlacementsRef.current(placements);
          } catch {
            /* skip this frame on inference error */
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!disposed) raf = requestAnimationFrame(tick);
    };

    engine
      .init(1)
      .then(() => {
        if (!disposed) raf = requestAnimationFrame(tick);
      })
      .catch(() => {
        /* face model failed to load; accessories simply won't show */
      });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.close();
      onPlacementsRef.current([]);
    };
  }, [active, hasAccessories, videoRef]);
}
