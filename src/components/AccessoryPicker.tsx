import { useAppStore } from '@/store/appStore';
import { ACCESSORIES } from '@/features/photo/accessories';

export function AccessoryPicker() {
  const accessoryIds = useAppStore((s) => s.accessoryIds);
  const toggleAccessory = useAppStore((s) => s.toggleAccessory);
  const clearAccessories = useAppStore((s) => s.clearAccessories);

  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          🥸 Phụ kiện gắn mặt
        </span>
        {accessoryIds.length > 0 && (
          <button
            type="button"
            onClick={clearAccessories}
            className="text-xs text-white/40 hover:text-white/70"
            data-testid="accessory-clear"
          >
            Bỏ hết
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Accessories">
        {ACCESSORIES.map((a) => {
          const on = accessoryIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleAccessory(a.id)}
              aria-pressed={on}
              title={a.label}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
                on
                  ? 'border-accent bg-accent/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]'
              }`}
              data-testid={`accessory-${a.id}`}
            >
              <span className="text-lg" aria-hidden>
                {a.icon}
              </span>
              {a.label}
            </button>
          );
        })}
      </div>
      {accessoryIds.length > 0 && (
        <p className="mt-2 text-xs text-white/40">
          Phụ kiện sẽ bám theo mặt và được lưu vào ảnh khi chụp.
        </p>
      )}
    </div>
  );
}
