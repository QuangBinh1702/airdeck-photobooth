import { create } from 'zustand';
import type { GestureId } from '@/types/gestures';
import type { AppMode } from '@/features/gestures/gestureMapper';
import type { ShutterGestureId } from '@/features/photo/shutterGesture';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'error'
  | 'no-device';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Self-timer options (seconds). 0 = instant. */
export type TimerSeconds = 0 | 3 | 5 | 10;

/**
 * How a photo is triggered:
 *  - 'shape':   hands DRAW geometric shapes (triangle/star/circle/quad); the
 *               photo is taken with the button / Space / timer, and the shape
 *               is composited into the image. (Default — matches the reference.)
 *  - 'gesture': holding a hand sign (✌️/👍/🖐️) auto-triggers the countdown;
 *               no shapes are drawn, so there is no overlap of meaning.
 */
export type CaptureMode = 'shape' | 'gesture';

/** Layout for the 4-cut photo strip. */
export type StripLayoutId = 'vertical-4' | 'grid-2x2';

export interface CapturedPhoto {
  id: string;
  /** Raw capture data URL (filtered, mirrored). */
  src: string;
  createdAt: number;
}

export interface AppState {
  mode: AppMode;
  cameraStatus: CameraStatus;
  engineStatus: EngineStatus;
  fps: number;
  handsDetected: number;
  currentGesture: GestureId | null;
  /** The named hand sign currently held (for the photobooth shutter HUD). */
  shutterGesture: ShutterGestureId;
  filterId: string;
  frameId: string;
  timer: TimerSeconds;
  captureMode: CaptureMode;
  photos: CapturedPhoto[];
  selectedPhotoId: string | null;
  /** Ordered photo ids chosen for the 4-cut strip (max = strip capacity). */
  stripSelection: string[];
  stripLayout: StripLayoutId;
  stripThemeId: string;
  lastError: string | null;

  setMode: (mode: AppMode) => void;
  setCameraStatus: (s: CameraStatus) => void;
  setEngineStatus: (s: EngineStatus) => void;
  setFps: (fps: number) => void;
  setHandsDetected: (n: number) => void;
  setCurrentGesture: (g: GestureId | null) => void;
  setShutterGesture: (g: ShutterGestureId) => void;
  setFilterId: (id: string) => void;
  setFrameId: (id: string) => void;
  setTimer: (t: TimerSeconds) => void;
  setCaptureMode: (m: CaptureMode) => void;
  addPhoto: (src: string) => string;
  removePhoto: (id: string) => void;
  selectPhoto: (id: string | null) => void;
  clearPhotos: () => void;
  /** Toggle a photo in/out of the strip selection (respects capacity). */
  toggleStripPhoto: (id: string) => void;
  clearStripSelection: () => void;
  setStripLayout: (layout: StripLayoutId) => void;
  setStripThemeId: (id: string) => void;
  setError: (msg: string | null) => void;
}

/** How many cells each strip layout holds. */
export const STRIP_CAPACITY: Record<StripLayoutId, number> = {
  'vertical-4': 4,
  'grid-2x2': 4,
};

let photoCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  mode: 'photo',
  cameraStatus: 'idle',
  engineStatus: 'idle',
  fps: 0,
  handsDetected: 0,
  currentGesture: null,
  shutterGesture: 'none',
  filterId: 'none',
  frameId: 'classic-white',
  timer: 3,
  captureMode: 'shape',
  photos: [],
  selectedPhotoId: null,
  stripSelection: [],
  stripLayout: 'vertical-4',
  stripThemeId: 'classic-white',
  lastError: null,

  setMode: (mode) => set({ mode }),
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  setEngineStatus: (engineStatus) => set({ engineStatus }),
  setFps: (fps) => set({ fps: Math.round(fps) }),
  setHandsDetected: (handsDetected) => set({ handsDetected }),
  setCurrentGesture: (currentGesture) => set({ currentGesture }),
  setShutterGesture: (shutterGesture) => set({ shutterGesture }),
  setFilterId: (filterId) => set({ filterId }),
  setFrameId: (frameId) => set({ frameId }),
  setTimer: (timer) => set({ timer }),
  setCaptureMode: (captureMode) => set({ captureMode }),
  addPhoto: (src) => {
    photoCounter += 1;
    const id = `photo-${Date.now()}-${photoCounter}`;
    set((state) => ({
      photos: [{ id, src, createdAt: Date.now() }, ...state.photos].slice(0, 24),
      selectedPhotoId: id,
    }));
    return id;
  },
  removePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      selectedPhotoId:
        state.selectedPhotoId === id ? null : state.selectedPhotoId,
      stripSelection: state.stripSelection.filter((s) => s !== id),
    })),
  selectPhoto: (selectedPhotoId) => set({ selectedPhotoId }),
  clearPhotos: () =>
    set({ photos: [], selectedPhotoId: null, stripSelection: [] }),
  toggleStripPhoto: (id) =>
    set((state) => {
      if (state.stripSelection.includes(id)) {
        return {
          stripSelection: state.stripSelection.filter((s) => s !== id),
        };
      }
      const capacity = STRIP_CAPACITY[state.stripLayout];
      if (state.stripSelection.length >= capacity) {
        return state; // at capacity — ignore further additions
      }
      return { stripSelection: [...state.stripSelection, id] };
    }),
  clearStripSelection: () => set({ stripSelection: [] }),
  setStripLayout: (stripLayout) =>
    set((state) => ({
      stripLayout,
      // Trim selection if the new layout has smaller capacity.
      stripSelection: state.stripSelection.slice(
        0,
        STRIP_CAPACITY[stripLayout],
      ),
    })),
  setStripThemeId: (stripThemeId) => set({ stripThemeId }),
  setError: (lastError) => set({ lastError }),
}));
