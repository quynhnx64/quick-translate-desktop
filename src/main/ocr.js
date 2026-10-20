const path = require("path");
const { createWorker } = require("tesseract.js");

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const langPath = path.join(__dirname, "../../assets");
      const worker = await createWorker("eng", 1, {
        langPath,
        gzip: false,
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
      });
      return worker;
    })();
  }
  return workerPromise;
}

async function ocrImageBuffer(pngBuffer) {
  const worker = await getWorker();
  const {
    data: { text, confidence },
  } = await worker.recognize(pngBuffer);
  return {
    ok: true,
    text: String(text || "").trim(),
    confidence: confidence || 0,
  };
}

module.exports = { ocrImageBuffer };
