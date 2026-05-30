import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraStatus } from '@/store/appStore';
import {
  applyAutoSettings,
  buildVideoConstraints,
  trackResolution,
} from '@/features/camera/cameraConstraints';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  /** Actual negotiated capture resolution (for the HUD). */
  resolution: { width: number; height: number } | null;
  start: () => Promise<void>;
  stop: () => void;
  /**
   * Grab a full-resolution still via ImageCapture when supported (higher than
   * the video frame). Resolves to an ImageBitmap, or null to fall back to the
   * <video> frame.
   */
  grabStill: () => Promise<ImageBitmap | null>;
}

/**
 * Manages webcam access via getUserMedia and binds the stream to a <video>.
 *
 * Quality notes:
 *  - Requests the highest practical resolution + continuous auto exposure /
 *    white-balance / focus so the sensor's ISP handles lighting.
 *  - Exposes `grabStill()` (ImageCapture.takePhoto/grabFrame) which captures at
 *    the camera's native still resolution — typically sharper than the video.
 *  - getUserMedia requires a secure context (HTTPS or localhost).
 *  - Releases tracks on unmount so the camera light turns off.
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const imageCaptureRef = useRef<ImageCapture | null>(null);
  // Tracks whether takePhoto() has proven unsupported/too slow on this device,
  // so repeated captures skip it instead of paying the timeout every time.
  const takePhotoOkRef = useRef(true);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    trackRef.current = null;
    imageCaptureRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setResolution(null);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('getUserMedia is not available in this browser/context.');
      return;
    }
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        buildVideoConstraints('user'),
      );
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0] ?? null;
      trackRef.current = track;

      if (track) {
        await applyAutoSettings(track);
        setResolution(trackResolution(track));
        // Set up ImageCapture for full-res stills when available.
        takePhotoOkRef.current = true;
        const IC = (
          window as unknown as { ImageCapture?: typeof ImageCapture }
        ).ImageCapture;
        if (IC) {
          try {
            imageCaptureRef.current = new IC(track);
          } catch {
            imageCaptureRef.current = null;
          }
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          /* autoplay may need a user gesture; preview still binds */
        });
      }
      setStatus('ready');
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied');
        setError('Camera permission was denied.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('no-device');
        setError('No camera device was found.');
      } else {
        setStatus('error');
        setError((err as Error)?.message ?? 'Unknown camera error.');
      }
    }
  }, []);

  const grabStill = useCallback(async (): Promise<ImageBitmap | null> => {
    const ic = imageCaptureRef.current;
    if (!ic) return null;
    // Guard against slow/hanging takePhoto() on some devices: race a timeout so
    // the shutter never stalls; on timeout we fall back to the <video> frame.
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          window.setTimeout(() => reject(new Error('still timeout')), ms),
        ),
      ]);

    // Try the full-resolution still only while it keeps working.
    if (takePhotoOkRef.current) {
      try {
        const blob = await withTimeout(ic.takePhoto(), 1200);
        return await withTimeout(createImageBitmap(blob), 1200);
      } catch {
        // Mark unsupported so future captures skip straight to the fallbacks.
        takePhotoOkRef.current = false;
      }
    }
    try {
      return await withTimeout(ic.grabFrame(), 800);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, status, error, resolution, start, stop, grabStill };
}
