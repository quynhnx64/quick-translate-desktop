const path = require("path");
const { createWorker } = require("tesseract.js");

let workerPromise = null;

function assetsDir() {
  return path.resolve(__dirname, "../../assets");
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Trong Electron, getEnvironment() = "electron" (≠ "node"),
      // nên langPath dạng D:\... bị fetch như URL → "Only absolute URLs are supported".
      // Cách đúng: để eng.traineddata ở cachePath, đọc bằng fs (không fetch).
      const worker = await createWorker("eng", 1, {
        cachePath: assetsDir(),
        cacheMethod: "readOnly",
        gzip: false,
        logger: () => {},
        errorHandler: (err) => {
          console.error("[ocr]", err);
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
      });
      return worker;
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

async function ocrImageBuffer(pngBuffer) {
  try {
    const worker = await getWorker();
    const {
      data: { text, confidence },
    } = await worker.recognize(pngBuffer);
    return {
      ok: true,
      text: String(text || "").trim(),
      confidence: confidence || 0,
    };
  } catch (err) {
    return {
      ok: false,
      detail: String(err?.message || err),
    };
  }
}

module.exports = { ocrImageBuffer };
