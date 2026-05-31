import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { StudioView } from '@/components/StudioView';
import { Hud } from '@/components/Hud';
import { GestureCheatsheet } from '@/components/GestureCheatsheet';
import { Onboarding } from '@/components/Onboarding';
import { Tour } from '@/components/Tour';

// Module-level guard so the first-run auto tour fires exactly once, even under
// React StrictMode's double-invoked effects in development.
let autoTourTriggered = false;

export function App() {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const startTour = useAppStore((s) => s.startTour);

  // First visit ever: auto-run the guided tour once, then remember it so it
  // never auto-starts again (persisted via onboardingDone in localStorage).
  useEffect(() => {
    if (autoTourTriggered) return;
    if (useAppStore.getState().onboardingDone) return;
    autoTourTriggered = true;
    // Defer so the page has laid out before the spotlight measures targets.
    // Not cancelled on cleanup so StrictMode's first unmount can't kill it.
    window.setTimeout(() => {
      const s = useAppStore.getState();
      s.startTour();
      s.setOnboardingDone(true);
    }, 500);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <Onboarding />
      <Tour />

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            data-testid="sound-toggle"
          >
            {soundEnabled ? '🔊 Âm thanh' : '🔇 Tắt tiếng'}
          </button>
          <button
            type="button"
            onClick={() => startTour()}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10"
            title="Tour giới thiệu"
            data-testid="tour-btn"
          >
            ✨ Tour
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10"
            title="Xem hướng dẫn"
            data-testid="help-btn"
          >
            ❔ Hướng dẫn
          </button>
        </div>
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
