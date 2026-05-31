import { useAppStore } from '@/store/appStore';
import { Modal } from '@/components/Modal';

const STEPS = [
  {
    icon: '📷',
    title: 'Bật camera',
    desc: 'Cho phép truy cập camera. Mọi xử lý chạy ngay trên máy bạn — ảnh không rời khỏi trình duyệt.',
  },
  {
    icon: '🔺',
    title: 'Tạo hình bằng tay',
    desc: 'Chế độ Hình học: ghép ngón tay thành hình (🔺 tam giác, ⭐ ngôi sao, ⭕ vòng tròn, 🔲 hai tay) — giữ yên để tự đếm ngược chụp.',
  },
  {
    icon: '✌️',
    title: 'Hoặc chụp bằng cử chỉ',
    desc: 'Chuyển sang chế độ Cử chỉ tay rồi giơ ✌️ / 👍 / 🖐️ để tự chụp. Hoặc bấm nút 📸 / phím Space bất cứ lúc nào.',
  },
  {
    icon: '🥸',
    title: 'Trang trí & lưu',
    desc: 'Thêm filter, khung ảnh, phụ kiện gắn mặt; ghép dải 4-cut rồi tải về hoặc chia sẻ.',
  },
];

export function Onboarding() {
  const helpOpen = useAppStore((s) => s.helpOpen);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const startTour = useAppStore((s) => s.startTour);

  return (
    <Modal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      title="Chào mừng đến AirDeck"
    >
      <div
        className="w-[min(92vw,560px)] rounded-2xl bg-panel p-6"
        data-testid="onboarding"
      >
        <div className="mb-5 text-center">
          <div className="text-4xl" aria-hidden>
            ✦
          </div>
          <h2 className="mt-2 text-xl font-semibold">AirDeck Gesture Photobooth</h2>
          <p className="mt-1 text-sm text-white/55">
            Chụp ảnh rảnh tay bằng cử chỉ — 4 bước để bắt đầu.
          </p>
        </div>

        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg"
              >
                {s.icon}
              </span>
              <div>
                <p className="text-sm font-medium">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-white/55">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          className="btn-primary mt-6 w-full"
          data-testid="onboarding-start"
        >
          Đóng
        </button>
        <button
          type="button"
          onClick={() => {
            setHelpOpen(false);
            startTour();
          }}
          className="btn-ghost mt-2 w-full"
          data-testid="onboarding-tour"
        >
          ✨ Xem tour hướng dẫn
        </button>
      </div>
    </Modal>
  );
}
