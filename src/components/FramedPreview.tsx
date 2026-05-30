import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { composeFramedPhoto } from '@/features/photo/composeFrame';
import { loadImage } from '@/features/photo/loadImage';
import {
  buildFilename,
  downloadDataUrl,
  sharePhoto,
} from '@/features/photo/share';
import { Modal } from '@/components/Modal';

export function FramedPreview() {
  const photos = useAppStore((s) => s.photos);
  const selectedPhotoId = useAppStore((s) => s.selectedPhotoId);
  const frameId = useAppStore((s) => s.frameId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [framedUrl, setFramedUrl] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selected = photos.find((p) => p.id === selectedPhotoId) ?? null;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      setFramedUrl(null);
      return;
    }
    const canvas = canvasRef.current ?? document.createElement('canvas');
    loadImage(selected.src)
      .then((img) => {
        if (cancelled) return;
        const url = composeFramedPhoto(img, canvas, frameId);
        setFramedUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFramedUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, frameId]);

  const onDownload = () => {
    if (framedUrl) downloadDataUrl(framedUrl, buildFilename('airdeck', 'png'));
  };

  const onShare = async () => {
    if (framedUrl) await sharePhoto(framedUrl);
  };

  return (
    <section className="glass flex flex-col p-4" aria-label="Framed preview">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
        Xem trước & tải về
      </h2>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid flex-1 place-items-center rounded-xl bg-black/30 p-4">
        {framedUrl ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative"
            aria-label="Phóng to xem ảnh"
            data-testid="framed-preview-open"
          >
            <img
              src={framedUrl}
              alt="Ảnh đã lồng khung"
              className="max-h-80 rounded-md shadow-lg transition group-hover:opacity-90"
              data-testid="framed-image"
            />
            <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
              <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                🔍 Xem ảnh to
              </span>
            </span>
          </button>
        ) : (
          <p className="py-10 text-center text-sm text-white/40">
            Chọn một ảnh trong gallery để xem trước với khung đã chọn.
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={!framedUrl}
          className="btn-primary flex-1"
          data-testid="download-btn"
        >
          ⬇ Tải ảnh về
        </button>
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={!framedUrl}
            className="btn-ghost"
            data-testid="share-btn"
          >
            Chia sẻ
          </button>
        )}
      </div>

      {/* Full-size preview modal */}
      <Modal
        open={previewOpen && !!framedUrl}
        onClose={() => setPreviewOpen(false)}
        title="Xem ảnh"
      >
        {framedUrl && (
          <>
            <img
              src={framedUrl}
              alt="Ảnh đã lồng khung (phóng to)"
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              data-testid="framed-preview-image"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onDownload}
                className="btn-primary"
                data-testid="framed-preview-download"
              >
                ⬇ Tải ảnh về
              </button>
              {canShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="btn-ghost"
                  data-testid="framed-preview-share"
                >
                  Chia sẻ
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
