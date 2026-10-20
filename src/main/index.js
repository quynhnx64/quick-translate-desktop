const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
} = require("electron");
const path = require("path");
const { captureScreen } = require("./capture");
const { ocrImageBuffer } = require("./ocr");
const { translate } = require("../shared/translate");
const { DEFAULTS } = require("../shared/settings");

/** @type {BrowserWindow | null} */
let overlayWin = null;
/** @type {BrowserWindow | null} */
let resultWin = null;
/** @type {Tray | null} */
let tray = null;

const settings = { ...DEFAULTS };

function iconPath() {
  return path.join(__dirname, "../../assets/icon.png");
}

function createTray() {
  const img = nativeImage.createFromPath(iconPath());
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
  tray.setToolTip("Quick Translate Desktop");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Chụp vùng & dịch (Alt+Shift+S)", click: () => startCapture() },
      { type: "separator" },
      { label: "Thoát", click: () => app.quit() },
    ])
  );
  tray.on("double-click", () => startCapture());
}

function createOverlay() {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.show();
    overlayWin.focus();
    return overlayWin;
  }

  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;

  overlayWin = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload-overlay.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWin.setAlwaysOnTop(true, "screen-saver");
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWin.loadFile(path.join(__dirname, "../overlay/index.html"));
  overlayWin.on("closed", () => {
    overlayWin = null;
  });
  return overlayWin;
}

function createResultWindow(payload) {
  if (resultWin && !resultWin.isDestroyed()) {
    resultWin.close();
  }

  const display = screen.getPrimaryDisplay();
  const w = 420;
  const h = 520;
  const x = Math.round(display.workArea.x + display.workArea.width - w - 24);
  const y = Math.round(display.workArea.y + 48);

  resultWin = new BrowserWindow({
    x,
    y,
    width: w,
    height: h,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-result.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  resultWin.setAlwaysOnTop(true, "floating");
  resultWin.loadFile(path.join(__dirname, "../renderer/result.html"));
  resultWin.webContents.once("did-finish-load", () => {
    resultWin.webContents.send("result:data", {
      ...payload,
      settings,
    });
  });
  resultWin.on("closed", () => {
    resultWin = null;
  });
}

async function startCapture() {
  createOverlay();
}

/**
 * Crop PNG buffer bằng Electron nativeImage (không cần sharp).
 */
function cropPng(pngBuffer, rect, dpr) {
  const { nativeImage: ni } = require("electron");
  const img = ni.createFromBuffer(pngBuffer);
  const size = img.getSize();
  const scale = dpr || 1;
  const x = Math.max(0, Math.round(rect.x * scale));
  const y = Math.max(0, Math.round(rect.y * scale));
  const width = Math.min(size.width - x, Math.round(rect.w * scale));
  const height = Math.min(size.height - y, Math.round(rect.h * scale));
  if (width < 2 || height < 2) throw new Error("Vùng chọn quá nhỏ");
  return img.crop({ x, y, width, height }).toPNG();
}

ipcMain.handle("overlay:cancel", () => {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
});

ipcMain.handle("overlay:complete", async (_e, rect) => {
  try {
    if (overlayWin && !overlayWin.isDestroyed()) {
      overlayWin.hide();
    }

    // đợi overlay ẩn trước khi chụp
    await new Promise((r) => setTimeout(r, 80));

    const display = screen.getPrimaryDisplay();
    const dpr = display.scaleFactor || 1;
    const full = await captureScreen(0);
    const cropped = cropPng(full, rect, dpr);
    const dataUrl = `data:image/png;base64,${cropped.toString("base64")}`;

    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();

    createResultWindow({
      imageDataUrl: dataUrl,
      status: "Đang nhận diện chữ…",
      text: "",
      translated: "",
    });

    const ocr = await ocrImageBuffer(cropped);
    if (!ocr.ok || !ocr.text) {
      resultWin?.webContents.send("result:data", {
        imageDataUrl: dataUrl,
        status: ocr.detail || "OCR không đọc được chữ",
        text: "",
        translated: "",
        settings,
      });
      return { ok: false };
    }

    resultWin?.webContents.send("result:data", {
      imageDataUrl: dataUrl,
      status: "Đang dịch…",
      text: ocr.text,
      translated: "",
      confidence: ocr.confidence,
      settings,
    });

    const tr = await translate(
      ocr.text,
      settings.sourceLang,
      settings.targetLang
    );

    resultWin?.webContents.send("result:data", {
      imageDataUrl: dataUrl,
      status: tr.ok ? "Xong" : tr.detail || "Dịch thất bại",
      text: ocr.text,
      translated: tr.ok ? tr.translated : "",
      confidence: ocr.confidence,
      provider: tr.provider,
      settings,
    });

    return { ok: true };
  } catch (err) {
    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
    createResultWindow({
      imageDataUrl: "",
      status: String(err?.message || err),
      text: "",
      translated: "",
      settings,
    });
    return { ok: false, detail: String(err?.message || err) };
  }
});

ipcMain.handle("result:close", () => {
  if (resultWin && !resultWin.isDestroyed()) resultWin.close();
});

ipcMain.handle("result:retranslate", async (_e, text) => {
  const tr = await translate(text, settings.sourceLang, settings.targetLang);
  return tr;
});

app.whenReady().then(() => {
  createTray();

  const ok = globalShortcut.register("Alt+Shift+S", () => startCapture());
  if (!ok) {
    console.warn("Không đăng ký được Alt+Shift+S (có thể bị chiếm)");
  }

  // Không mở cửa sổ chính — chạy từ system tray
  console.log("Quick Translate Desktop sẵn sàng. Hotkey: Alt+Shift+S");
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // giữ process trên system tray (Windows) — không quit
});
