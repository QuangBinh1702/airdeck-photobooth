import { useAppStore } from '@/store/appStore';

export function Gallery() {
  const photos = useAppStore((s) => s.photos);
  const selectedPhotoId = useAppStore((s) => s.selectedPhotoId);
  const selectPhoto = useAppStore((s) => s.selectPhoto);
  const removePhoto = useAppStore((s) => s.removePhoto);
  const clearPhotos = useAppStore((s) => s.clearPhotos);
  const stripSelection = useAppStore((s) => s.stripSelection);
  const toggleStripPhoto = useAppStore((s) => s.toggleStripPhoto);

  return (
    <section className="glass p-4" aria-label="Gallery">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Ảnh đã chụp ({photos.length})
        </h2>
        {photos.length > 0 && (
          <button
            type="button"
            onClick={clearPhotos}
            className="text-xs text-white/40 hover:text-white/70"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">
          Chưa có ảnh nào. Chụp để ảnh xuất hiện ở đây, rồi chọn ảnh để bỏ vào
          khung hoặc ghép dải 4-cut.
        </p>
      ) : (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          data-testid="gallery"
        >
          {photos.map((p, i) => {
            const selected = p.id === selectedPhotoId;
            const stripIndex = stripSelection.indexOf(p.id);
            const inStrip = stripIndex >= 0;
            return (
              <div key={p.id} className="group relative">
                <button
                  type="button"
                  onClick={() => selectPhoto(p.id)}
                  aria-pressed={selected}
                  aria-label={`Chọn ảnh ${i + 1}`}
                  className={`block w-full overflow-hidden rounded-lg border-2 transition ${
                    selected
                      ? 'border-accent ring-2 ring-accent/40'
                      : 'border-transparent hover:border-white/30'
                  }`}
                  data-testid="gallery-item"
                >
                  <img
                    src={p.src}
                    alt={`Ảnh ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </button>

                {/* Add-to-strip toggle (shows order number when selected) */}
                <button
                  type="button"
                  onClick={() => toggleStripPhoto(p.id)}
                  aria-pressed={inStrip}
                  aria-label={
                    inStrip ? `Bỏ ảnh ${i + 1} khỏi dải` : `Thêm ảnh ${i + 1} vào dải`
                  }
                  className={`absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold transition ${
                    inStrip
                      ? 'bg-accent text-ink'
                      : 'bg-black/60 text-white/80 opacity-0 group-hover:opacity-100'
                  }`}
                  data-testid="gallery-strip-toggle"
                >
                  {inStrip ? stripIndex + 1 : '+ dải'}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={`Xoá ảnh ${i + 1}`}
                  className="absolute right-1 top-1 hidden h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white group-hover:grid"
                  data-testid="gallery-delete"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
