import { useAppStore } from '@/store/appStore';
import { DEFAULT_GESTURE_MAP } from '@/features/gestures/gestureMapper';

const GESTURE_EMOJI: Record<string, string> = {
  Open_Palm: '✋',
  Closed_Fist: '✊',
  Pointing_Up: '☝️',
  Thumb_Up: '👍',
  Thumb_Down: '👎',
  Victory: '✌️',
  ILoveYou: '🤟',
  Pinch: '🤏',
  Swipe_Left: '👈',
  Swipe_Right: '👉',
};

/** What each capture style does, shown in the photo-mode cheatsheet. */
const SHAPE_ROWS = [
  { emoji: '🔺', name: 'Tam giác', hint: 'cái + trỏ + giữa' },
  { emoji: '⭐', name: 'Ngôi sao', hint: 'cái + út' },
  { emoji: '⭕', name: 'Vòng tròn', hint: 'xòe bàn tay' },
  { emoji: '🔲', name: 'Khung 3D', hint: 'hai tay' },
];

const GESTURE_ROWS = [
  { emoji: '🖐️', name: 'Open palm', hint: 'tự chụp' },
  { emoji: '✌️', name: 'Victory', hint: 'tự chụp' },
  { emoji: '🤟', name: 'Rock', hint: 'tự chụp' },
  { emoji: '🤙', name: 'Call me', hint: 'tự chụp' },
  { emoji: '👍', name: 'Thumb up', hint: 'tự chụp' },
  { emoji: '☝️', name: 'Point', hint: 'tự chụp' },
];

function Row({
  emoji,
  name,
  hint,
}: {
  emoji: string;
  name: string;
  hint: string;
}) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-lg">
          {emoji}
        </span>
        <span className="text-white/70">{name}</span>
      </span>
      <span className="text-white/40">{hint}</span>
    </li>
  );
}

export function GestureCheatsheet() {
  const mode = useAppStore((s) => s.mode);
  const captureMode = useAppStore((s) => s.captureMode);

  // In photo mode, the cheatsheet follows the chosen capture style so it
  // matches what is actually active on screen.
  if (mode === 'photo') {
    const rows = captureMode === 'shape' ? SHAPE_ROWS : GESTURE_ROWS;
    const title = captureMode === 'shape' ? 'Hình học' : 'Cử chỉ tay';
    return (
      <div className="glass p-4">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
          Cử chỉ · {title}
        </h2>
        <p className="mb-3 text-xs text-white/40">
          {captureMode === 'shape'
            ? 'Giữ hình để tự đếm ngược & chụp — hình lồng vào ảnh'
            : 'Giữ một cử chỉ để tự đếm ngược & chụp'}
        </p>
        <ul className="space-y-2">
          {rows.map((r) => (
            <Row key={r.name} {...r} />
          ))}
        </ul>
      </div>
    );
  }

  // Cursor / slides modes: show the gesture→intent mapping.
  const entries = Object.entries(DEFAULT_GESTURE_MAP[mode]);
  return (
    <div className="glass p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
        Cử chỉ · {mode}
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-white/50">No gestures mapped.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([gesture, intent]) => (
            <Row
              key={gesture}
              emoji={GESTURE_EMOJI[gesture] ?? '•'}
              name={gesture.replace(/_/g, ' ')}
              hint={intent}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
