# Quick Translate Desktop (Windows)

App PC overlay: **chụp vùng màn hình → OCR (Tesseract) → dịch**.

Tách khỏi Chrome extension [`translate-english-practice`](../translate-english-practice). Phần đã copy/port:

| Từ extension | Dùng ở desktop |
|---|---|
| `background.js` translate (Google → MyMemory → Lingva) | `src/shared/translate.js` |
| Setting mặc định ngôn ngữ / cỡ chữ | `src/shared/settings.js` |
| `eng.traineddata` | `assets/eng.traineddata` |
| UX chụp vùng + panel kết quả | `src/overlay`, `src/renderer` |

## Yêu cầu

- Windows 10/11
- Node.js 18+ (chỉ khi **build**; người dùng cuối chỉ cần file cài)

## Chạy khi đang phát triển

```powershell
cd D:\REPO\quick-translate-desktop
npm install
npm start
```

App chạy trên **system tray** (không có cửa sổ chính).

- **Alt+Shift+S** — chọn vùng → OCR → dịch  
- Double-click icon tray — cùng thao tác  
- Right-click tray → Thoát  

## Đóng gói gửi người khác (installer)

```powershell
npm install
npm run dist
```

Sau khi xong, trong thư mục `dist/`:

| File | Dùng khi |
|---|---|
| `Quick Translate-0.1.0-x64.exe` | **Installer** (NSIS) — Next → chọn thư mục → cài |
| `Quick Translate-0.1.0-portable.exe` | **Portable** — chạy thẳng, không cần cài |

### Người nhận làm gì

**Cách 1 — Installer**

1. Tải `Quick Translate-0.1.0-x64.exe`
2. Chạy file → Next → cài
3. Mở từ Desktop / Start Menu
4. Icon hiện ở khay hệ thống (gần đồng hồ) → **Alt+Shift+S**

**Cách 2 — Portable**

1. Tải `Quick Translate-0.1.0-portable.exe`
2. Double-click là dùng (có thể copy USB)

> Windows SmartScreen có thể hiện “Windows protected your PC” vì app chưa ký certificate ($). Chọn **More info** → **Run anyway**.

## Ghi chú kỹ thuật

- Capture: `screenshot-desktop` + crop bằng Electron `nativeImage`
- OCR: `tesseract.js` + tessdata local (offline)
- Overlay: cửa sổ Electron trong suốt, luôn trên cùng
- Một số app full-screen / anti-cheat có thể chặn capture

## Việc còn lại

- UI settings (ngôn ngữ, cỡ chữ)
- Multi-monitor
- Code signing (bớt cảnh báo SmartScreen)
- Auto-start cùng Windows
