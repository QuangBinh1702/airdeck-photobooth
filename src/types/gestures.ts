/** Canonical gesture identifiers produced by the recognizer + derived logic. */
export type GestureId =
  // MediaPipe built-in categories
  | 'None'
  | 'Closed_Fist'
  | 'Open_Palm'
  | 'Pointing_Up'
  | 'Thumb_Down'
  | 'Thumb_Up'
  | 'Victory'
  | 'ILoveYou'
  // Derived gestures computed from raw landmarks
  | 'Pinch'
  | 'Swipe_Left'
  | 'Swipe_Right';

/** A recognized gesture with its confidence and the hand it came from. */
export interface GestureSample {
  id: GestureId;
  score: number;
  handedness: 'Left' | 'Right';
  /** Monotonic timestamp (ms) the sample was produced. */
  timestamp: number;
}

/** High-level intents the app reacts to, decoupled from raw gestures. */
export type IntentType =
  | 'cursor.move'
  | 'cursor.click'
  | 'cursor.dragStart'
  | 'cursor.dragEnd'
  | 'slide.next'
  | 'slide.prev'
  | 'slide.blank'
  | 'photo.shutter'
  | 'command.confirm'
  | 'command.cancel'
  | 'command.pause';

export interface Intent {
  type: IntentType;
  payload?: Record<string, number | string | boolean>;
  timestamp: number;
}
