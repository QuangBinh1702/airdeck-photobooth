/**
 * Minimal ambient declarations for the ImageCapture API and the advanced
 * camera MediaTrackConstraintSet hints, which are not yet in the default TS
 * DOM lib. Only the members we use are declared.
 */

interface PhotoCapabilities {
  imageWidth?: { min: number; max: number; step: number };
  imageHeight?: { min: number; max: number; step: number };
}

declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  takePhoto(photoSettings?: Record<string, unknown>): Promise<Blob>;
  grabFrame(): Promise<ImageBitmap>;
  getPhotoCapabilities(): Promise<PhotoCapabilities>;
  readonly track: MediaStreamTrack;
}

/** Advanced camera constraint hints (continuous AF/AE/AWB). */
interface MediaTrackConstraintSet {
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
}
