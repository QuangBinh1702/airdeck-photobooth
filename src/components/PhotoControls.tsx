import { useAppStore, type TimerSeconds } from '@/store/appStore';
import { FRAMES } from '@/features/photo/frames';
import { SHUTTER_GESTURES } from '@/features/photo/shutterGesture';

const TIMERS: TimerSeconds[] = [0, 3, 5, 10];

/** Shapes you can draw in 'shape' capture mode (for the legend). */
const SHAPE_LEGEND = [
  { emoji: '🔺', label: 'Tam giác — cái + trỏ + giữa' },
  { emoji: '⭐', label: 'Ngôi sao — cái + út' },
  { emoji: '⭕', label: 'Vòng tròn — xòe bàn tay' },
  { emoji: '🔲', label: 'Khung 3D — hai tay' },
];

export function PhotoControls() {
  const timer = useAppStore((s) => s.timer);
  const setTimer = useAppStore((s) => s.setTimer);
  const frameId = useAppStore((s) => s.frameId);
  const setFrameId = useAppStore((s) => s.setFrameId);
  const captureMode = useAppStore((s) => s.captureMode);
  const setCaptureMode = useAppStore((s) => s.setCaptureMode);

  return (
    <div className="glass p-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Capture mode — the two styles are mutually exclusive (no conflict) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            🎯 Kiểu chụp
          </span>
          <div className="flex gap-1.5" role="group" aria-label="Capture mode">
            <button
              type="button"
              onClick={() => setCaptureMode('shape')}
              aria-pressed={captureMode === 'shape'}
              className={`chip ${captureMode === 'shape' ? 'chip-on' : 'chip-off'}`}
              data-testid="mode-shape"
            >
              🔺 Hình học
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode('gesture')}
              aria-pressed={captureMode === 'gesture'}
              className={`chip ${captureMode === 'gesture' ? 'chip-on' : 'chip-off'}`}
              data-testid="mode-gesture"
            >
              ✌️ Cử chỉ tay
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            ⏱ Hẹn giờ
          </span>
          <div className="flex gap-1.5" role="group" aria-label="Self timer">
            {TIMERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimer(t)}
                aria-pressed={timer === t}
                className={`chip ${timer === t ? 'chip-on' : 'chip-off'}`}
                data-testid={`timer-${t}`}
              >
                {t === 0 ? 'Ngay' : `${t}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Frame picker */}
      <div className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          🖼 Khung ảnh
        </span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Frame">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFrameId(f.id)}
              aria-pressed={frameId === f.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                frameId === f.id
                  ? 'border-accent bg-accent/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]'
              }`}
              data-testid={`frame-${f.id}`}
            >
              <span
                aria-hidden
                className="h-5 w-5 rounded-md border border-white/20"
                style={{ background: f.background }}
              />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend — depends on the active capture mode */}
      <div
        className="mt-4 border-t border-white/10 pt-3"
        data-testid="capture-legend"
      >
        {captureMode === 'shape' ? (
          <div data-testid="shape-legend">
            <p className="mb-2 text-xs text-white/45">
              Tạo hình bằng tay, rồi bấm chụp — hình được lồng vào ảnh:
            </p>
            <div className="flex flex-wrap gap-3">
              {SHAPE_LEGEND.map((g) => (
                <span
                  key={g.label}
                  className="flex items-center gap-1.5 text-xs text-white/55"
                >
                  <span className="text-base" aria-hidden>
                    {g.emoji}
                  </span>
                  {g.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div data-testid="gesture-legend">
            <p className="mb-2 text-xs text-white/45">
              Giơ và giữ một cử chỉ để tự động chụp:
            </p>
            <div className="flex flex-wrap gap-3">
              {SHUTTER_GESTURES.map((g) => (
                <span
                  key={g.id}
                  className="flex items-center gap-1.5 text-xs text-white/55"
                >
                  <span className="text-base" aria-hidden>
                    {g.emoji}
                  </span>
                  {g.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
