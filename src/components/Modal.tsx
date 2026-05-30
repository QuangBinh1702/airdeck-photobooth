import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Full-screen lightbox rendered via a portal to <body>.
 *
 * Rendering to the body is important: ancestors that use `backdrop-filter`
 * (our `.glass` panels) create a containing block that would otherwise trap a
 * `position: fixed` overlay inside the panel. The portal escapes that so the
 * backdrop truly covers the whole viewport and only the content shows.
 *
 *  - Solid dark backdrop, content centered.
 *  - Closes on Escape, backdrop click, or the floating ✕.
 *  - Locks page scroll while open.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Preview'}
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      {/* Floating close button (always reachable, doesn't crowd the content) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg text-white/90 transition hover:bg-white/20"
        data-testid="modal-close"
      >
        ✕
      </button>

      {/* Content (clicks inside don't close) */}
      <div
        className="flex max-h-full max-w-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
