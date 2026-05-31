import { create } from 'zustand';
import type { GestureId } from '@/types/gestures';
import type { AppMode } from '@/features/gestures/gestureMapper';
import type { ShutterGestureId } from '@/features/photo/shutterGesture';
import { loadJSON, mergeStored, saveJSON } from '@/lib/persist';
import { TOUR_STEPS } from '@/features/tour/tourSteps';

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
  resolution: { width: number; height: number } | null;
  currentGesture: GestureId | null;
  /** The named hand sign currently held (for the photobooth shutter HUD). */
  shutterGesture: ShutterGestureId;
  filterId: string;
  frameId: string;
  timer: TimerSeconds;
  captureMode: CaptureMode;
  photos: CapturedPhoto[];
  selectedPhotoId: string | null;
  /** Selected accessory ids (face stickers) to overlay + bake into photos. */
  accessoryIds: string[];
  /** Ordered photo ids chosen for the 4-cut strip (max = strip capacity). */
  stripSelection: string[];
  stripLayout: StripLayoutId;
  stripThemeId: string;
  /** Play shutter / countdown sounds. Persisted. */
  soundEnabled: boolean;
  /** Whether the first-run onboarding has been completed/dismissed. Persisted. */
  onboardingDone: boolean;
  /** Whether the help/onboarding modal is open (transient, not persisted). */
  helpOpen: boolean;
  /** Guided tour: active flag + current step index. */
  tourActive: boolean;
  tourStep: number;
  lastError: string | null;

  setMode: (mode: AppMode) => void;
  setCameraStatus: (s: CameraStatus) => void;
  setEngineStatus: (s: EngineStatus) => void;
  setFps: (fps: number) => void;
  setHandsDetected: (n: number) => void;
  setResolution: (r: { width: number; height: number } | null) => void;
  setCurrentGesture: (g: GestureId | null) => void;
  setShutterGesture: (g: ShutterGestureId) => void;
  setFilterId: (id: string) => void;
  setFrameId: (id: string) => void;
  setTimer: (t: TimerSeconds) => void;
  setCaptureMode: (m: CaptureMode) => void;
  toggleAccessory: (id: string) => void;
  clearAccessories: () => void;
  addPhoto: (src: string) => string;
  removePhoto: (id: string) => void;
  selectPhoto: (id: string | null) => void;
  clearPhotos: () => void;
  /** Toggle a photo in/out of the strip selection (respects capacity). */
  toggleStripPhoto: (id: string) => void;
  clearStripSelection: () => void;
  setStripLayout: (layout: StripLayoutId) => void;
  setStripThemeId: (id: string) => void;
  setSoundEnabled: (on: boolean) => void;
  setOnboardingDone: (done: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
  setError: (msg: string | null) => void;
}

/** How many cells each strip layout holds. */
export const STRIP_CAPACITY: Record<StripLayoutId, number> = {
  'vertical-4': 4,
  'grid-2x2': 4,
};

/** User settings that persist across sessions (localStorage). */
export interface PersistedSettings {
  filterId: string;
  frameId: string;
  timer: TimerSeconds;
  captureMode: CaptureMode;
  accessoryIds: string[];
  stripLayout: StripLayoutId;
  stripThemeId: string;
  soundEnabled: boolean;
  onboardingDone: boolean;
}

const SETTINGS_KEY = 'settings';

const DEFAULT_SETTINGS: PersistedSettings = {
  filterId: 'none',
  frameId: 'classic-white',
  timer: 3,
  captureMode: 'shape',
  accessoryIds: [],
  stripLayout: 'vertical-4',
  stripThemeId: 'classic-white',
  soundEnabled: true,
  onboardingDone: false,
};

const initialSettings = mergeStored(
  DEFAULT_SETTINGS,
  loadJSON<Partial<PersistedSettings>>(SETTINGS_KEY, {}),
);

let photoCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  mode: 'photo',
  cameraStatus: 'idle',
  engineStatus: 'idle',
  fps: 0,
  handsDetected: 0,
  resolution: null,
  currentGesture: null,
  shutterGesture: 'none',
  filterId: initialSettings.filterId,
  frameId: initialSettings.frameId,
  timer: initialSettings.timer,
  captureMode: initialSettings.captureMode,
  photos: [],
  selectedPhotoId: null,
  accessoryIds: initialSettings.accessoryIds,
  stripSelection: [],
  stripLayout: initialSettings.stripLayout,
  stripThemeId: initialSettings.stripThemeId,
  soundEnabled: initialSettings.soundEnabled,
  onboardingDone: initialSettings.onboardingDone,
  helpOpen: false,
  tourActive: false,
  tourStep: 0,
  lastError: null,

  setMode: (mode) => set({ mode }),
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  setEngineStatus: (engineStatus) => set({ engineStatus }),
  setFps: (fps) => set({ fps: Math.round(fps) }),
  setHandsDetected: (handsDetected) => set({ handsDetected }),
  setResolution: (resolution) => set({ resolution }),
  setCurrentGesture: (currentGesture) => set({ currentGesture }),
  setShutterGesture: (shutterGesture) => set({ shutterGesture }),
  setFilterId: (filterId) => set({ filterId }),
  setFrameId: (frameId) => set({ frameId }),
  setTimer: (timer) => set({ timer }),
  setCaptureMode: (captureMode) => set({ captureMode }),
  toggleAccessory: (id) =>
    set((state) => ({
      accessoryIds: state.accessoryIds.includes(id)
        ? state.accessoryIds.filter((a) => a !== id)
        : [...state.accessoryIds, id],
    })),
  clearAccessories: () => set({ accessoryIds: [] }),
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
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  nextTourStep: () =>
    set((state) => {
      const last = TOUR_STEPS.length - 1;
      if (state.tourStep >= last) return { tourActive: false, tourStep: 0 };
      return { tourStep: state.tourStep + 1 };
    }),
  prevTourStep: () =>
    set((state) => ({ tourStep: Math.max(0, state.tourStep - 1) })),
  endTour: () => set({ tourActive: false }),
  setError: (lastError) => set({ lastError }),
}));

/**
 * Persist the settings slice to localStorage whenever it changes. Subscribed
 * once at module load; only the persisted keys are written.
 */
useAppStore.subscribe((state) => {
  const settings: PersistedSettings = {
    filterId: state.filterId,
    frameId: state.frameId,
    timer: state.timer,
    captureMode: state.captureMode,
    accessoryIds: state.accessoryIds,
    stripLayout: state.stripLayout,
    stripThemeId: state.stripThemeId,
    soundEnabled: state.soundEnabled,
    onboardingDone: state.onboardingDone,
  };
  saveJSON(SETTINGS_KEY, settings);
});
