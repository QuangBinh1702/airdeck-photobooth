import { useEffect, useRef, useState } from 'react';
import {
  useAppStore,
  STRIP_CAPACITY,
  type StripLayoutId,
} from '@/store/appStore';
import { STRIP_THEMES } from '@/features/photo/stripThemes';
import { composeStrip } from '@/features/photo/composeStrip';
import { loadImage } from '@/features/photo/loadImage';
import { buildFilename, downloadDataUrl } from '@/features/photo/share';
import { Modal } from '@/components/Modal';

const LAYOUTS: { id: StripLayoutId; label: string }[] = [
  { id: 'vertical-4', label: '4 dọc' },
  { id: 'grid-2x2', label: 'Lưới 2×2' },
];

export function StripMaker() {
  const photos = useAppStore((s) => s.photos);
  const stripSelection = useAppStore((s) => s.stripSelection);
  const stripLayout = useAppStore((s) => s.stripLayout);
  const stripThemeId = useAppStore((s) => s.stripThemeId);
  const setStripLayout = useAppStore((s) => s.setStripLayout);
  const setStripThemeId = useAppStore((s) => s.setStripThemeId);
  const clearStripSelection = useAppStore((s) => s.clearStripSelection);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const capacity = STRIP_CAPACITY[stripLayout];

  // The ordered list of selected photo sources.
  const selectedSrcs = stripSelection
    .map((id) => photos.find((p) => p.id === id)?.src)
    .filter((s): s is string => Boolean(s));

  // Rebuild the strip whenever selection / layout / theme changes.
  useEffect(() => {
    let cancelled = false;
    if (selectedSrcs.length === 0) {
      setStripUrl(null);
      return;
    }
    setBuilding(true);
    Promise.all(selectedSrcs.map(loadImage))
      .then((imgs) => {
        if (cancelled) return;
        const canvas = canvasRef.current ?? document.createElement('canvas');
        const url = composeStrip(imgs, canvas, {
          layout: stripLayout,
          themeId: stripThemeId,
        });
        setStripUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStripUrl(null);
      })
      .finally(() => {
        if (!cancelled) setBuilding(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripSelection.join(','), stripLayout, stripThemeId]);

  const onDownload = () => {
    if (stripUrl) downloadDataUrl(stripUrl, buildFilename('airdeck-strip', 'png'));
  };

  return (
    <section className="glass p-4" aria-label="4-cut photo strip">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          🎞 Dải ảnh 4-cut ({stripSelection.length}/{capacity})
        </h2>
        {stripSelection.length > 0 && (
          <button
            type="button"
            onClick={clearStripSelection}
            className="text-xs text-white/40 hover:text-white/70"
            data-testid="strip-clear"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* Layout + theme pickers */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs text-white/45">Bố cục</span>
          <div className="flex gap-1.5" role="group" aria-label="Strip layout">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setStripLayout(l.id)}
                aria-pressed={stripLayout === l.id}
                className={`chip ${stripLayout === l.id ? 'chip-on' : 'chip-off'}`}
                data-testid={`strip-layout-${l.id}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs text-white/45">Màu</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Strip theme">
            {STRIP_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStripThemeId(t.id)}
                aria-pressed={stripThemeId === t.id}
                aria-label={t.label}
                title={t.label}
                className={`h-7 w-7 rounded-md border-2 transition ${
                  stripThemeId === t.id
                    ? 'border-accent ring-2 ring-accent/40'
                    : 'border-white/15 hover:border-white/40'
                }`}
                style={{ background: t.background }}
                data-testid={`strip-theme-${t.id}`}
              />
            ))}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      <div className="grid place-items-center rounded-xl bg-black/30 p-4">
        {stripUrl ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative"
            aria-label="Phóng to xem trước dải ảnh"
            data-testid="strip-preview-open"
          >
            <img
              src={stripUrl}
              alt="Dải ảnh 4-cut"
              className="max-h-96 rounded-md shadow-lg transition group-hover:opacity-90"
              data-testid="strip-image"
            />
            <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
              <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                🔍 Xem trước
              </span>
            </span>
          </button>
        ) : (
          <p className="py-10 text-center text-sm text-white/40">
            {building
              ? 'Đang dựng dải ảnh…'
              : 'Chọn ảnh trong gallery (nút “+ dải”) để ghép thành dải 4-cut.'}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          disabled={!stripUrl}
          className="btn-ghost flex-1"
          data-testid="strip-preview-btn"
        >
          🔍 Xem trước
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={!stripUrl}
          className="btn-primary flex-1"
          data-testid="strip-download"
        >
          ⬇ Tải dải ảnh
        </button>
      </div>

      {/* Full-size preview modal */}
      <Modal
        open={previewOpen && !!stripUrl}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước dải ảnh 4-cut"
      >
        {stripUrl && (
          <>
            <img
              src={stripUrl}
              alt="Dải ảnh 4-cut (phóng to)"
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              data-testid="strip-preview-image"
            />
            <button
              type="button"
              onClick={onDownload}
              className="btn-primary mt-4"
              data-testid="strip-preview-download"
            >
              ⬇ Tải dải ảnh
            </button>
          </>
        )}
      </Modal>
    </section>
  );
}
