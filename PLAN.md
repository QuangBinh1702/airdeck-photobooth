# AirDeck — Touchless Control Hub

> Web app điều khiển hoàn toàn bằng **cử chỉ tay qua webcam** (không chạm), kết hợp **Computer Vision** real-time trong trình duyệt.
> Người dùng dùng tay để di con trỏ, click, lật slide, chỉnh âm lượng/zoom, vẽ trong không khí, và ra lệnh nhanh bằng các cử chỉ chuẩn (👍 ✊ ✋ ✌️ 🤏).

---

## 0. Trạng thái triển khai (2026-05-30)

MVP end-to-end đã được dựng và xác minh trong repo này:

- **Phase 0** ✅ Scaffold Vite + React 18 + TS, Tailwind, ESLint/Prettier, CI (`.github/workflows/ci.yml`).
- **Phase 1-2** ✅ CV engine (MediaPipe wrapper) + logic cử chỉ thuần (geometry, One-Euro filter, finger-state, pinch, swipe, gesture FSM, mapper) — đã unit test.
- **Phase 3.5** ✅ Photo Studio: gesture shutter + countdown 3-2-1, filters real-time, gallery, capture/share, vẽ hình theo cử chỉ (🔺⭐⭕🔲) + auto-capture, khung ảnh + lồng khung tải về, **4-cut photo strip** (chọn nhiều ảnh → ghép dải dọc/2×2 + theme màu → tải). UI: `StudioView`, `Hud`, `GestureCheatsheet`, `PhotoControls`, `Gallery`, `FramedPreview`, `StripMaker`, `OverlayCanvas`.
- **Phase 5 (một phần)** ✅ AdaptiveQuality + FpsMeter, loop tự dừng khi tab ẩn.
- **Phase 7** ✅ Test theo 3 skill: 87 unit test (coverage 71.65%), 6 E2E Playwright (fake camera), artifacts PRD/test-cases/test-report trong `docs/`.

**Còn lại / nâng cao:** cursor & slides UI hoàn chỉnh (logic đã sẵn), pose auto-capture UI, đổi nền (segmentation), custom gesture model (Phase 6), và TC-007 (gesture shutter end-to-end) — cần Playwright MCP harness, hiện đánh dấu BLOCKED.

---

## 1. Tổng quan & Mục tiêu

**Vấn đề giải quyết**
- Thuyết trình rảnh tay (không cần clicker/chuột).
- Kiosk công cộng hợp vệ sinh (không chạm màn hình).
- Hỗ trợ tiếp cận (accessibility) cho người khó dùng chuột/bàn phím.
- Demo công nghệ ấn tượng cho portfolio.

**Mục tiêu sản phẩm (MVP)**
- Nhận diện bàn tay + cử chỉ real-time ≥ 24 FPS trên laptop tầm trung.
- Độ trễ cử chỉ → hành động < 100ms (cảm giác tức thì).
- Chạy 100% client-side (privacy: video không rời thiết bị).
- Tối thiểu 6 cử chỉ → 6 nhóm hành động.
- **Chụp ảnh không chạm**: tạo dáng/giơ cử chỉ → tự chụp → trang trí (filter/khung/sticker) → xuất ảnh hoặc photo-strip 4-cut để chia sẻ.

**Ngoài phạm vi (Non-goals) giai đoạn đầu**
- Không nhận diện khuôn mặt/danh tính.
- Không cần GPU rời chuyên dụng.
- Không hỗ trợ mobile-first ở MVP (desktop trước, mobile sau).

---

## 2. Tech Stack (đã chốt)

| Lớp | Lựa chọn | Lý do |
|-----|----------|-------|
| CV core | **`@mediapipe/tasks-vision` (GestureRecognizer + HandLandmarker + PoseLandmarker)** | Chuẩn de-facto 2025, WASM + GPU, real-time, privacy tốt. PoseLandmarker (33 điểm toàn thân) cho tính năng tạo dáng/auto-capture |
| Framework | **React 18 + Vite + TypeScript** | DX nhanh, HMR, type-safe |
| State | **Zustand** | Nhẹ, phù hợp state real-time (con trỏ, cử chỉ hiện tại) |
| Styling | **Tailwind CSS** | Dựng UI nhanh, nhất quán |
| Canvas/Viz | **Canvas 2D API** (+ tùy chọn Three.js cho phase nâng cao) | Vẽ landmark, overlay, mode vẽ tay |
| Custom model | **MediaPipe Model Maker** (Python, Colab) | Train cử chỉ riêng nếu cần |
| Test | **Vitest + React Testing Library + Playwright** | Unit + E2E |
| Lint/Format | **ESLint + Prettier** | Chất lượng code |
| CI/CD | **GitHub Actions** | Tự động lint/test/build |
| Deploy | **Vercel** hoặc **Netlify** (static + HTTPS, cần cho webcam) | Webcam yêu cầu HTTPS |

> Ghi chú kỹ thuật: `getUserMedia` (webcam) **bắt buộc HTTPS** (hoặc `localhost`). Mọi môi trường staging/prod phải có TLS.

---

## 3. Kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────┐
│                        Browser (Client)                    │
│                                                            │
│  Webcam ─▶ Video Stream ─▶ CV Engine (MediaPipe WASM/GPU)  │
│                              │                             │
│                              ▼                             │
│                     Landmarks + Gesture                    │
│                              │                             │
│              ┌───────────────┼───────────────┐            │
│              ▼               ▼               ▼            │
│        Gesture Mapper   Smoothing/Filter   Overlay Render  │
│              │               (Kalman/EMA)    (Canvas)      │
│              ▼                                             │
│        Action Dispatcher ─▶ App Features                   │
│        (cursor / slide / volume / draw / commands)         │
│                              │                             │
│                              ▼                             │
│                      Zustand Store (UI state)              │
└──────────────────────────────────────────────────────────┘
```

**Module chính**
- `cv-engine`: khởi tạo model, vòng lặp suy luận theo frame.
- `gesture-mapper`: ánh xạ cử chỉ + landmark → ý định (intent).
- `smoothing`: làm mượt toạ độ (EMA/One-Euro filter) chống rung.
- `action-dispatcher`: thực thi hành động tương ứng intent.
- `overlay`: vẽ skeleton tay, con trỏ ảo, feedback.
- `ui`: các màn (Home, Demo, Settings, Calibration).

---

## 4. Lộ trình theo Phase

> Mỗi Phase chia thành các Sub-phase nhỏ, có **Deliverable** (đầu ra) và **Definition of Done (DoD)**.

---

### PHASE 0 — Khởi tạo dự án & Nền tảng
**Mục tiêu:** Có khung dự án chạy được, CI sạch, tài liệu cơ bản.

- **0.1 — Scaffold dự án**
  - `npm create vite@latest` (React + TS), cấu trúc thư mục `src/{components,features,lib,store,hooks,types}`.
  - DoD: `npm run dev` chạy được trang trắng.
- **0.2 — Công cụ chất lượng**
  - Cài ESLint + Prettier + Tailwind, cấu hình path alias (`@/`).
  - DoD: `npm run lint` pass, format tự động.
- **0.3 — CI cơ bản**
  - GitHub Actions: install → lint → typecheck → build.
  - DoD: workflow xanh trên PR.
- **0.4 — Tài liệu khởi đầu**
  - `README.md` (mục tiêu, cách chạy), `.env.example`, giấy phép.
  - DoD: người mới clone chạy được theo README.

---

### PHASE 1 — Webcam & CV Engine cơ bản
**Mục tiêu:** Lấy được video và vẽ được landmark tay real-time.

- **1.1 — Truy cập webcam**
  - Hook `useCamera()` dùng `getUserMedia`, xử lý quyền truy cập, chọn thiết bị.
  - DoD: hiển thị live video, xử lý lỗi từ chối quyền.
- **1.2 — Tích hợp MediaPipe Tasks Vision**
  - Cài `@mediapipe/tasks-vision`, load WASM + model `hand_landmarker.task`.
  - Khởi tạo `FilesetResolver`, chọn delegate GPU (fallback CPU).
  - DoD: console log ra landmark khi đưa tay vào khung hình.
- **1.3 — Vòng lặp suy luận theo frame**
  - `requestAnimationFrame` + `detectForVideo(timestamp)`, tránh memory leak.
  - DoD: chạy ổn định không tăng RAM theo thời gian.
- **1.4 — Overlay skeleton**
  - Vẽ 21 landmark + nối khớp lên Canvas trùng khít video (mirror).
  - DoD: skeleton bám theo tay mượt khi di chuyển.
- **1.5 — HUD đo hiệu năng**
  - Hiển thị FPS, độ trễ suy luận, số tay phát hiện.
  - DoD: thấy FPS ≥ 24 trên máy tham chiếu.

---

### PHASE 2 — Nhận diện cử chỉ & Lớp ánh xạ ý định
**Mục tiêu:** Từ landmark/cử chỉ → "intent" có ý nghĩa, ổn định.

- **2.1 — Gắn GestureRecognizer**
  - Đổi sang `GestureRecognizer` (model dựng sẵn: Open_Palm, Closed_Fist, Pointing_Up, Thumb_Up, Victory, ILoveYou...).
  - DoD: hiển thị tên cử chỉ + độ tin cậy real-time.
- **2.2 — Cử chỉ phái sinh từ landmark**
  - Tính **pinch** (khoảng cách ngón cái–trỏ), **swipe** (vận tốc cổ tay), **point** (hướng ngón trỏ).
  - DoD: 3 cử chỉ phái sinh phát hiện ổn định.
- **2.3 — Làm mượt & chống rung**
  - One-Euro filter / EMA cho toạ độ; debounce cho cử chỉ rời rạc.
  - DoD: con trỏ ảo không giật, cử chỉ không "nháy".
- **2.4 — Máy trạng thái cử chỉ (gesture FSM)**
  - Quản lý transition (idle → pinch_down → pinch_up = click), tránh trigger lặp.
  - DoD: 1 cử chỉ = đúng 1 hành động, không bị lặp.
- **2.5 — Bảng ánh xạ cấu hình được**
  - Cấu hình `gesture → action` dạng JSON, dễ thêm/sửa.
  - DoD: đổi mapping không cần sửa logic lõi.

---

### PHASE 3 — Tính năng hành động (Core Features)
**Mục tiêu:** Biến cử chỉ thành hành động thật, đủ cho MVP.

- **3.1 — Con trỏ ảo (Virtual Cursor)**
  - Di ngón trỏ → di con trỏ; pinch → click; pinch giữ → drag.
  - DoD: chọn được nút/menu trong app bằng tay.
- **3.2 — Điều khiển trình chiếu (Slide/Carousel)**
  - Swipe trái/phải → prev/next; ✊ → blank screen; 👍 → bắt đầu.
  - DoD: lật được bộ slide mẫu mượt mà.
- **3.3 — Thanh trượt cử chỉ (Volume/Zoom)**
  - Khoảng cách pinch hoặc 2 tay → giá trị 0–100%.
  - DoD: kéo mượt, có ngưỡng & feedback số.
- **3.4 — Air Drawing (vẽ trong không khí)**
  - Ngón trỏ = bút, ✋ = nhấc bút, chọn màu/độ dày, xoá toàn bộ.
  - DoD: vẽ + lưu PNG được.
- **3.5 — Lệnh nhanh (Command palette cử chỉ)**
  - ✌️ next, ✋ pause, 👍 confirm, ✊ cancel với feedback rõ ràng.
  - DoD: mỗi lệnh có phản hồi hình ảnh + (tuỳ chọn) âm thanh.

---

### PHASE 3.5 — Gesture Photo Studio ⭐ (Tính năng "ăn tiền")
**Mục tiêu:** Biến app thành một **photobooth không chạm**: tạo dáng → tự chụp → trang trí → xuất ảnh/strip đẹp để chia sẻ. Đây là phần tạo cảm giác "xịn xò" và dễ viral nhất.

> Nền tảng trend (research 2025–2026): photobooth Hàn "4-cut" (인생네컷) đang cực hot với Gen Z; film/retro aesthetic (grain, light leak) lên ngôi; AR filter + cử chỉ trigger hiệu ứng là chuẩn mới.
> Nguồn tham khảo: [Seoulz](https://www.seoulz.com/korea-photo-booth-2026/), [Beautipin](https://beautipin.com/blogs/magazine/korean-four-cut-photo-booths-self-studios), [TechRepublic — AI photo trends](https://www.techrepublic.com/article/news-ai-photo-editing-trends-2026/), [Banuba — AR photobooth](https://www.banuba.com/blog/best-ar-photo-booth-software-reviewed-tested). *(Nội dung đã được diễn giải lại để tuân thủ bản quyền.)*

- **3.5.1 — Chụp ảnh bằng cử chỉ (Gesture Shutter)**
  - Giơ cử chỉ (✌️ / ✋ / 👍 / 🤏 pinch) → kích hoạt **đếm ngược 3-2-1** → chụp.
  - Gộp `video + nét vẽ + overlay` vào 1 canvas, xuất PNG/JPG bằng `canvas.toBlob()`.
  - DoD: giơ tay là chụp được, ảnh ra có đủ người + hình vẽ + filter.
- **3.5.2 — Pose Guide & Auto-Capture (tạo dáng)**
  - Thêm **MediaPipe PoseLandmarker** (33 điểm toàn thân).
  - Hiện "khung dáng mẫu" (pose template); khi người dùng đứng **khớp dáng** (so khớp góc khớp/landmark, có ngưỡng) → tự động chụp.
  - Thư viện vài dáng gợi ý: chữ V tay, giơ 2 tay, trái tim bằng tay, dáng nghiêng...
  - DoD: đứng đúng dáng mẫu thì tự chụp, có chỉ báo "khớp 80%..." trực quan.
- **3.5.3 — Bộ lọc & chỉnh màu real-time (Filters)**
  - Filter qua CSS/Canvas/WebGL shader: B&W, vintage/film, warm, cool, **film grain + light leak** (theo trend retro).
  - Tùy chọn beautify nhẹ (làm mịn) — giữ tự nhiên.
  - DoD: đổi filter thấy ngay trên preview, áp đúng vào ảnh xuất.
- **3.5.4 — Khung & Sticker (AR overlay)**
  - Khung ảnh (frame), nhãn dán (sticker) bám theo tay/đầu, text caption + ngày giờ.
  - Cử chỉ trigger hiệu ứng vui: 👍 → confetti, ✌️ → tim bay, ✊ → "freeze".
  - DoD: thêm/bớt sticker & khung, hiệu ứng chạy mượt không tụt FPS.
- **3.5.5 — Chế độ "4-Cut Photo Strip" (theo trend Hàn Quốc)**
  - Chụp liên tiếp 4 dáng (mỗi dáng có đếm ngược) → ghép thành **strip dọc** với khung/màu chọn được.
  - Chọn layout (4 dọc, 2x2), màu nền, logo/caption.
  - DoD: tạo ra 1 ảnh strip hoàn chỉnh đúng tỉ lệ in/chia sẻ.
- **3.5.6 — Lưu, tải & chia sẻ**
  - Tải PNG/JPG; copy vào clipboard; **Web Share API** (chia sẻ mạng xã hội/mobile); tạo QR để lấy ảnh sang điện thoại.
  - Gallery tạm trong phiên (localStorage / IndexedDB) để xem lại ảnh đã chụp.
  - DoD: tải & chia sẻ được ảnh đơn và strip; QR mở ra ảnh đúng.
- **3.5.7 — Hậu cảnh ảo (tùy chọn nâng cao)**
  - Dùng segmentation (PoseLandmarker mask / ImageSegmenter) để **đổi/làm mờ phông nền**.
  - DoD: thay nền/blur nền mượt, viền người không bị rỗ nhiều.

---

**Mục tiêu:** Dễ dùng cho người lần đầu, ổn định nhiều điều kiện.

- **4.1 — Onboarding & quyền webcam**
  - Màn hướng dẫn cử chỉ, xin quyền có ngữ cảnh, trạng thái "no hand detected".
  - DoD: người mới hiểu cách dùng trong < 60 giây.
- **4.2 — Calibration**
  - Hiệu chỉnh vùng hoạt động, độ nhạy, tay thuận trái/phải, ánh sáng yếu.
  - DoD: lưu cấu hình vào `localStorage`, áp dụng lại khi mở.
- **4.3 — Bảng "Gesture Cheatsheet"**
  - Overlay danh sách cử chỉ + hành động, bật/tắt nhanh.
  - DoD: xem được mọi cử chỉ hỗ trợ.
- **4.4 — Accessibility & fallback**
  - Fallback chuột/bàn phím cho mọi tính năng; tôn trọng `prefers-reduced-motion`; nhãn ARIA.
  - DoD: dùng được đầy đủ không cần webcam.
- **4.5 — Xử lý lỗi & trạng thái rỗng**
  - Thông báo khi không có camera, model lỗi load, FPS thấp (gợi ý hạ chất lượng).
  - DoD: không có màn hình "treo" không lý do.

---

### PHASE 5 — Hiệu năng & Độ tin cậy
**Mục tiêu:** Mượt trên nhiều máy, không rò rỉ tài nguyên.

- **5.1 — Web Worker / OffscreenCanvas**
  - Đẩy suy luận/vẽ sang worker để không chặn main thread.
  - DoD: UI không khựng khi suy luận nặng.
- **5.2 — Thích ứng chất lượng động**
  - Tự giảm độ phân giải/số tay khi FPS tụt; chế độ "battery saver".
  - DoD: giữ FPS mục tiêu trên máy yếu.
- **5.3 — Quản lý vòng đời tài nguyên**
  - Giải phóng model/stream khi unmount, dừng RAF khi tab ẩn (`visibilitychange`).
  - DoD: RAM ổn định sau 30 phút chạy.
- **5.4 — Đo đạc & telemetry (tùy chọn, ẩn danh)**
  - Đo FPS/độ trễ cục bộ (không gửi video), bật/tắt được.
  - DoD: có dashboard hiệu năng cục bộ.

---

### PHASE 6 — Custom Gesture (Nâng cao, tùy chọn)
**Mục tiêu:** Tự định nghĩa cử chỉ riêng ngoài bộ dựng sẵn.

- **6.1 — Thu thập dữ liệu**
  - Công cụ ghi landmark theo nhãn ngay trong web (export dataset).
  - DoD: tạo được dataset theo định dạng Model Maker.
- **6.2 — Train model**
  - Dùng MediaPipe Model Maker (Colab) train custom gesture, xuất `.task`.
  - DoD: có model nhận cử chỉ tự định nghĩa.
- **6.3 — Tích hợp & A/B**
  - Nạp model custom, so sánh độ chính xác với model gốc.
  - DoD: chuyển đổi model trong Settings.

---

### PHASE 7 — Testing, Tài liệu & Deploy
**Mục tiêu:** Sẵn sàng public, dễ bảo trì, demo được.

- **7.1 — Unit & integration test**
  - Test pure logic: gesture math, smoothing, FSM, mapper (Vitest).
  - DoD: coverage cho lõi logic ≥ 70%.
- **7.2 — E2E test**
  - Playwright với video/stream giả lập, kiểm tra luồng UI chính.
  - DoD: luồng "mở app → nhận tay (mock) → hành động" pass.
- **7.3 — Tối ưu build & PWA (tùy chọn)**
  - Code-split model, lazy-load nặng, cache WASM; cân nhắc PWA offline.
  - DoD: Lighthouse Performance ≥ 90 (trừ phần webcam).
- **7.4 — Tài liệu & demo**
  - Trang demo có video hướng dẫn, GIF cử chỉ, kiến trúc, hạn chế đã biết.
  - DoD: README + trang demo đủ để người lạ tự dùng.
- **7.5 — Deploy production**
  - Vercel/Netlify (HTTPS), domain, kiểm tra quyền webcam trên prod.
  - DoD: link public chạy được, webcam hoạt động.

---

## 5. Cấu trúc thư mục đề xuất

```
src/
├── components/        # UI components tái sử dụng (Button, Panel, HUD...)
├── features/
│   ├── camera/        # useCamera, chọn thiết bị
│   ├── cv/            # khởi tạo MediaPipe, vòng lặp suy luận
│   ├── gestures/      # FSM, math (pinch/swipe/point), mapper
│   ├── cursor/        # virtual cursor
│   ├── slides/        # điều khiển trình chiếu
│   ├── draw/          # air drawing
│   ├── photo/         # photo studio: shutter, pose-guide, filters, frames, 4-cut strip, share
│   └── commands/      # lệnh nhanh
├── lib/               # smoothing (one-euro), utils, math
├── store/             # Zustand stores
├── hooks/             # hooks dùng chung
├── types/             # kiểu dữ liệu chung (Landmark, Gesture, Intent)
└── pages/             # Home, Demo, Settings, Calibration
```

---

## 6. Rủi ro & Cách giảm thiểu

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|--------|-----------|------------|
| Ánh sáng yếu → mất tay | Trải nghiệm kém | Calibration + cảnh báo + tăng smoothing |
| Máy yếu → FPS thấp | Lag, khó dùng | Adaptive quality + Web Worker |
| Cử chỉ trigger nhầm/lặp | Hành động sai | Gesture FSM + debounce + ngưỡng tin cậy |
| Webcam cần HTTPS | Không chạy trên http | Bắt buộc TLS ở mọi env |
| Lo ngại quyền riêng tư | Người dùng e ngại | Nói rõ "100% client-side, video không rời máy" |
| Khác biệt trình duyệt (Safari) | Lỗi tương thích | Test đa trình duyệt + fallback CPU |
| Pose/filter nặng → tụt FPS khi chụp | Lag lúc tạo dáng | Chỉ bật PoseLandmarker ở chế độ Photo Studio; tách model theo mode |
| So khớp dáng quá nhạy/khó khớp | Auto-capture trượt | Ngưỡng linh hoạt + chỉ báo % khớp + cho phép chụp thủ công bằng cử chỉ |

---

## 7. Tiêu chí thành công (Definition of Success)

- ✅ ≥ 6 cử chỉ → ≥ 6 nhóm hành động hoạt động ổn định.
- ✅ FPS ≥ 24, độ trễ < 100ms trên máy tham chiếu.
- ✅ Dùng được đầy đủ qua fallback khi không có webcam (accessibility).
- ✅ Deploy public qua HTTPS, người lạ tự dùng được nhờ onboarding.
- ✅ Lõi logic có test, CI xanh.

---

## 8. Thứ tự ưu tiên gợi ý

1. **MVP demo-able:** Phase 0 → 1 → 2 → 3 (chọn 3.1 + 3.2 trước).
2. **Tính năng "ăn tiền" (wow factor):** Phase 3.5 (ưu tiên 3.5.1 Gesture Shutter → 3.5.3 Filters → 3.5.5 4-Cut Strip → 3.5.6 Share). Đây là phần dễ gây ấn tượng & chia sẻ nhất.
3. **Polish trải nghiệm:** Phase 4 → 5.
4. **Public:** Phase 7.
5. **Nâng cao (nếu còn thời gian):** Phase 6 + 3.5.2 Pose Guide + 3.5.7 đổi nền + các feature 3.3–3.4 còn lại.

---

## 9. Bước tiếp theo

Khi bạn sẵn sàng, mình có thể bắt đầu **Phase 0** ngay: scaffold dự án Vite + React + TS, cài Tailwind/ESLint/Prettier và dựng khung thư mục như trên. Chỉ cần nói "bắt đầu Phase 0".
