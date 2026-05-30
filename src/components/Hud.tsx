import { useAppStore } from '@/store/appStore';

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? 'bg-accent' : 'bg-white/30'
      }`}
    />
  );
}

export function Hud() {
  const { fps, handsDetected, currentGesture, cameraStatus, engineStatus } =
    useAppStore();

  return (
    <div
      className="glass p-4 text-sm"
      role="status"
      aria-live="polite"
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
        Engine
      </h2>
      <dl className="space-y-2">
        <div className="flex items-center justify-between">
          <dt className="text-white/60">Camera</dt>
          <dd className="flex items-center gap-2" data-testid="hud-camera">
            <StatusDot ok={cameraStatus === 'ready'} />
            {cameraStatus}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/60">CV model</dt>
          <dd className="flex items-center gap-2" data-testid="hud-engine">
            <StatusDot ok={engineStatus === 'ready'} />
            {engineStatus}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/60">FPS</dt>
          <dd data-testid="hud-fps" className="tabular-nums">
            {fps}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/60">Hands</dt>
          <dd data-testid="hud-hands" className="tabular-nums">
            {handsDetected}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/60">Gesture</dt>
          <dd data-testid="hud-gesture" className="font-medium text-accent">
            {currentGesture ?? '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
