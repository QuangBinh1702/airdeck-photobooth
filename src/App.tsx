import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { StudioView } from '@/components/StudioView';
import { Hud } from '@/components/Hud';
import { GestureCheatsheet } from '@/components/GestureCheatsheet';
import { Onboarding } from '@/components/Onboarding';
import { Tour } from '@/components/Tour';
import { useMediaQuery } from '@/lib/useMediaQuery';

// Module-level guard so the first-run auto tour fires exactly once, even under
// React StrictMode's double-invoked effects in development.
let autoTourTriggered = false;

export function App() {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const startTour = useAppStore((s) => s.startTour);
  // Tailwind `lg` breakpoint. The Engine HUD + gesture guide live in the
  // desktop sidebar; on mobile the HUD is dropped entirely and the gesture
  // guide moves inline near the capture controls (rendered by StudioView).
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink/60 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
                                                            <svg className="h-8 w-8 shrink-0 select-none sm:h-9 sm:w-9" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="header-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5eead4" />
                <stop offset="50%" stop-color="#8b5cf6" />
                <stop offset="100%" stop-color="#a78bfa" />
              </linearGradient>
              <linearGradient id="header-lens-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5eead4" />
                <stop offset="100%" stop-color="#a78bfa" />
              </linearGradient>
              <filter id="header-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <g transform="rotate(10, 256, 256)" opacity="0.25">
              <rect x="191" y="56" width="130" height="400" rx="16" fill="#141821" stroke="url(#header-brand-grad)" stroke-width="4" />
              <rect x="201" y="66" width="110" height="84" rx="8" fill="#0b0d12" />
              <rect x="201" y="158" width="110" height="84" rx="8" fill="#0b0d12" />
              <rect x="201" y="250" width="110" height="84" rx="8" fill="#0b0d12" />
              <rect x="201" y="342" width="110" height="84" rx="8" fill="#0b0d12" />
            </g>
            <g transform="rotate(-6, 256, 256)">
              <rect x="191" y="56" width="130" height="400" rx="16" fill="#141821" stroke="url(#header-brand-grad)" stroke-width="5" filter="url(#header-neon-glow)" />
              <g transform="translate(201, 66)">
                <rect width="110" height="84" rx="8" fill="#0b0d12" stroke="url(#header-brand-grad)" stroke-width="1.5" />
                <circle cx="55" cy="42" r="20" fill="none" stroke="#5eead4" stroke-width="3" />
                <path d="M 47 37 A 1.5 1.5 0 1 1 47 36 Z" fill="#5eead4" stroke="#5eead4" stroke-width="1.5" />
                <path d="M 63 37 A 1.5 1.5 0 1 1 63 36 Z" fill="#5eead4" stroke="#5eead4" stroke-width="1.5" />
                <path d="M 46 47 Q 55 56 64 47" fill="none" stroke="#5eead4" stroke-width="2.5" stroke-linecap="round" />
              </g>
              <g transform="translate(201, 158)">
                <rect width="110" height="84" rx="8" fill="#0b0d12" stroke="url(#header-brand-grad)" stroke-width="1.5" />
                <rect x="25" y="22" width="60" height="40" rx="6" fill="none" stroke="#header-brand-grad)" stroke-width="3" />
                <path d="M 40 22 L 45 16 L 65 16 L 70 22 Z" fill="none" stroke="#header-brand-grad)" stroke-width="3" stroke-linejoin="round" />
                <circle cx="55" cy="42" r="14" fill="none" stroke="#header-brand-grad)" stroke-width="3" />
                <circle cx="55" cy="42" r="6" fill="#header-brand-grad)" />
                <circle cx="74" cy="30" r="3" fill="#5eead4" />
              </g>
              <g transform="translate(201, 250)">
                <rect width="110" height="84" rx="8" fill="#0b0d12" stroke="url(#header-brand-grad)" stroke-width="1.5" />
                <path d="M 55 58 C 55 58 32 42 32 30 C 32 19 41 14 48 14 C 52 14 55 18 55 18 C 55 18 58 14 62 14 C 69 14 78 19 78 30 C 78 42 55 58 55 58 Z" fill="none" stroke="#5eead4" stroke-width="4" stroke-linejoin="round" />
              </g>
              <g transform="translate(201, 342)">
                <rect width="110" height="84" rx="8" fill="#0b0d12" stroke="url(#header-brand-grad)" stroke-width="1.5" />
                <g transform="translate(37, 10) scale(0.6)" filter="url(#header-neon-glow)">
                  <path d="M 40 90 C 25 90, 20 70, 20 55 C 20 45, 10 40, 15 30 C 20 20, 32 25, 38 38 L 38 12 C 38 4, 48 4, 48 12 L 48 42 L 48 15 C 48 7, 58 7, 58 15 L 58 50 C 62 50, 72 52, 72 62 C 72 70, 62 70, 62 62 M 62 62 C 64 62, 74 65, 74 72 C 74 80, 62 80, 50 85 L 40 90" 
                        fill="url(#header-brand-grad)" fill-opacity="0.15" 
                        stroke="url(#header-brand-grad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="43" y1="12" x2="53" y2="15" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 3" opacity="0.7" />
                  <circle cx="43" cy="12" r="4" fill="#ffffff" />
                  <circle cx="53" cy="15" r="4" fill="#ffffff" />
                  <circle cx="15" cy="30" r="3.5" fill="#5eead4" />
                </g>
              </g>
              <text x="256" y="444" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" letter-spacing="4" fill="url(#header-brand-grad)" text-anchor="middle" opacity="0.8">AIRDECK</text>
            </g>
            <path d="M 110 180 L 113 186 L 120 189 L 113 192 L 110 198 L 107 192 L 100 189 L 107 186 Z" fill="#5eead4" filter="url(#header-neon-glow)" />
            <path d="M 390 300 L 392 304 L 397 306 L 392 308 L 390 312 L 388 308 L 383 306 L 388 304 Z" fill="#a78bfa" filter="url(#header-neon-glow)" />
          </svg>
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            AirDeck
            <span className="ml-2 hidden text-sm font-normal text-white/50 sm:inline">
              Gesture Photobooth
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 sm:px-3"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            data-testid="sound-toggle"
          >
            {soundEnabled ? '🔊' : '🔇'}
            <span className="ml-1.5 hidden sm:inline">
              {soundEnabled ? 'Âm thanh' : 'Tắt tiếng'}
            </span>
          </button>
          <button
            type="button"
            onClick={startTour}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 sm:px-3"
            title="Xem tour hướng dẫn"
            data-testid="tour-btn"
          >
            ✨<span className="ml-1.5 hidden sm:inline">Tour</span>
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 sm:px-3"
            title="Xem hướng dẫn"
            data-testid="help-btn"
          >
            ❔<span className="ml-1.5 hidden sm:inline">Hướng dẫn</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-6 lg:flex-row">
        <section className="flex-1" aria-label="Camera stage">
          <StudioView />
        </section>
        {isDesktop && (
          <aside className="w-full space-y-4 lg:w-80">
            <Hud />
            <GestureCheatsheet />
          </aside>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/40 sm:px-6">
        100% xử lý trên thiết bị — hình ảnh camera không rời khỏi trình duyệt
        của bạn.
      </footer>
    </div>
  );
}
