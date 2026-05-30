import { useAppStore } from '@/store/appStore';
import type { AppMode } from '@/features/gestures/gestureMapper';
import { StudioView } from '@/components/StudioView';
import { Hud } from '@/components/Hud';
import { GestureCheatsheet } from '@/components/GestureCheatsheet';

const MODES: { id: AppMode; label: string }[] = [
  { id: 'photo', label: 'Photo Studio' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'slides', label: 'Slides' },
];

export function App() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink/60 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-ink"
          >
            ✦
          </span>
          <h1 className="text-lg font-semibold tracking-tight">
            AirDeck
            <span className="ml-2 text-sm font-normal text-white/50">
              Gesture Photobooth
            </span>
          </h1>
        </div>
        <nav
          aria-label="Mode"
          className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                mode === m.id
                  ? 'bg-gradient-to-r from-accent to-accent2 font-medium text-ink'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-6 lg:flex-row">
        <section className="flex-1" aria-label="Camera stage">
          <StudioView />
        </section>
        <aside className="w-full space-y-4 lg:w-80">
          <Hud />
          <GestureCheatsheet />
        </aside>
      </main>

      <footer className="border-t border-white/10 px-6 py-3 text-center text-xs text-white/40">
        100% xử lý trên thiết bị — hình ảnh camera không rời khỏi trình duyệt
        của bạn.
      </footer>
    </div>
  );
}
