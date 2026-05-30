import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraStatus } from '@/store/appStore';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Manages webcam access via getUserMedia and binds the stream to a <video>.
 *
 * Notes:
 *  - getUserMedia requires a secure context (HTTPS or localhost).
 *  - We release tracks on unmount to avoid the camera light staying on.
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          /* autoplay may require a user gesture; preview still binds */
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

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, status, error, start, stop };
}
