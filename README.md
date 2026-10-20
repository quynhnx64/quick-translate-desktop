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
- Node.js 18+

## Chạy

```powershell
cd D:\REPO\quick-translate-desktop
npm install
npm start
```

App chạy trên **system tray** (không có cửa sổ chính).

- **Alt+Shift+S** — chọn vùng → OCR → dịch  
- Double-click icon tray — cùng thao tác  
- Right-click tray → Thoát  

## Ghi chú kỹ thuật

- Capture: `screenshot-desktop` + crop bằng Electron `nativeImage`
- OCR: `tesseract.js` + tessdata local (offline sau lần đầu load worker)
- Overlay: cửa sổ Electron trong suốt, luôn trên cùng
- Một số app full-screen / anti-cheat có thể chặn capture

## Việc còn lại (chưa làm)

- UI settings (ngôn ngữ, cỡ chữ) như popup extension
- Multi-monitor chọn đúng màn
- Đóng gói `.exe` (electron-builder)
- Auto-start cùng Windows
