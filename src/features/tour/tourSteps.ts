import {
  mockAccessory,
  mockFramed,
  mockPhoto,
  mockStrip,
} from '@/features/tour/mockArt';

export interface TourStep {
  id: string;
  /** CSS selector of the real element to spotlight (optional = centered card). */
  target?: string;
  title: string;
  body: string;
  /** Optional mock illustration (data URL) shown in the tooltip. */
  image?: string;
  /** Preferred tooltip placement relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

/** The guided tour content. Targets reference data-testid attributes. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Chào mừng đến AirDeck ✦',
    body: 'Photobooth điều khiển bằng cử chỉ tay. Cùng dạo nhanh qua các tính năng nhé!',
    placement: 'center',
    image: mockFramed('AirDeck'),
  },
  {
    id: 'stage',
    target: '[data-testid="camera-video"]',
    title: 'Sân khấu camera',
    body: 'Khung hình trực tiếp. Mọi xử lý chạy trên máy bạn — ảnh không rời trình duyệt.',
    placement: 'bottom',
  },
  {
    id: 'capture',
    target: '[data-testid="capture-btn"]',
    title: 'Chụp ảnh',
    body: 'Bấm để chụp, hoặc nhấn phím Space. Bạn cũng có thể để cử chỉ tự chụp.',
    placement: 'top',
  },
  {
    id: 'mode',
    target: '[data-testid="mode-shape"]',
    title: 'Kiểu chụp',
    body: 'Hình học: ghép ngón tay thành hình rồi giữ yên để tự chụp. Cử chỉ tay: giơ ✌️/👍/🖐️ để chụp.',
    placement: 'bottom',
  },
  {
    id: 'timer',
    target: '[data-testid="timer-3"]',
    title: 'Hẹn giờ',
    body: 'Chọn 3/5/10 giây hoặc chụp ngay. Có tiếng đếm ngược cho dễ canh.',
    placement: 'bottom',
  },
  {
    id: 'frames',
    target: '[data-testid="frame-classic-white"]',
    title: 'Khung ảnh',
    body: 'Chọn khung để lồng vào ảnh — Classic, Film, Sunset, Mint…',
    placement: 'bottom',
    image: mockFramed('Classic'),
  },
  {
    id: 'accessories',
    target: '[data-testid="accessory-glasses"]',
    title: 'Phụ kiện gắn mặt',
    body: 'Thêm kính, mũ, tai thỏ… bám theo mặt bạn theo thời gian thực và lưu vào ảnh.',
    placement: 'top',
    image: mockAccessory(),
  },
  {
    id: 'gallery',
    target: '[data-testid="gallery-section"]',
    title: 'Ảnh đã chụp',
    body: 'Bấm vào ảnh để chọn (xem trước + lồng khung), hoặc nút “+ dải” để thêm vào dải 4-cut.',
    placement: 'top',
    image: mockPhoto(),
  },
  {
    id: 'preview',
    target: '[data-testid="download-btn"]',
    title: 'Xem trước & tải về',
    body: 'Xem ảnh đã lồng khung, bấm ảnh để phóng to, rồi tải về hoặc chia sẻ.',
    placement: 'top',
    image: mockFramed('AirDeck'),
  },
  {
    id: 'strip',
    target: '[data-testid="strip-download"]',
    title: 'Dải ảnh 4-cut',
    body: 'Chọn tối đa 4 ảnh, chọn bố cục + màu, rồi tải dải ảnh kiểu Hàn Quốc.',
    placement: 'top',
    image: mockStrip(),
  },
];
