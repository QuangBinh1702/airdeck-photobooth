import { useState, type ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';

interface CollapsibleProps {
  /** Short, action-oriented header shown only on mobile. */
  title: string;
  /** Optional right-aligned hint (e.g. a count) shown in the mobile header. */
  badge?: ReactNode;
  /** Whether the section starts expanded on mobile. Default: false. */
  defaultOpen?: boolean;
  children: ReactNode;
  'data-testid'?: string;
}

/**
 * Mobile-only accordion.
 *
 * On small screens it renders a tappable header that shows/hides its content,
 * so the phone layout stays short instead of one long scroll. On `lg` and up
 * the toggle is hidden and the content is always visible (`lg:block`), leaving
 * the desktop layout untouched.
 *
 * While the guided tour is running, every section is force-expanded so the
 * spotlight can actually land on the controls it describes (many tour targets
 * live inside these sections on mobile). When the tour ends, sections revert to
 * the user's own open/closed state.
 */
export function Collapsible({
  title,
  badge,
  defaultOpen = false,
  children,
  'data-testid': testId,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const tourActive = useAppStore((s) => s.tourActive);
  const expanded = open || tourActive;

  return (
    <section>
      {/* Mobile toggle header (hidden on desktop). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left backdrop-blur-xl transition hover:bg-white/[0.08] lg:hidden"
        data-testid={testId}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white/85">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {badge != null && (
            <span className="text-xs text-white/45">{badge}</span>
          )}
          <span
            aria-hidden
            className={`text-white/50 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            ▾
          </span>
        </span>
      </button>

      {/* Content: toggled on mobile, always shown from `lg` up. */}
      <div
        className={`${expanded ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}
        data-collapsible-content
      >
        {children}
      </div>
    </section>
  );
}
