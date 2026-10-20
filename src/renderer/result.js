(() => {
  const els = {
    preview: document.getElementById("preview"),
    status: document.getElementById("status"),
    text: document.getElementById("text"),
    translated: document.getElementById("translated"),
    btnClose: document.getElementById("btnClose"),
    btnRetry: document.getElementById("btnRetry"),
    btnCopy: document.getElementById("btnCopy"),
  };

  function apply(data) {
    if (!data) return;
    if (data.imageDataUrl) {
      els.preview.hidden = false;
      els.preview.src = data.imageDataUrl;
    }
    els.status.textContent = data.status || "";
    if (typeof data.text === "string") els.text.value = data.text;
    els.translated.textContent = data.translated || "";

    const fsSource = data.settings?.fontSizeSource || 15;
    const fsResult = data.settings?.fontSizeResult || 17;
    els.text.style.fontSize = `${fsSource}px`;
    document.documentElement.style.setProperty("--qt-fs-result", `${fsResult}px`);
  }

  window.qt.onData(apply);

  els.btnClose.addEventListener("click", () => window.qt.close());

  els.btnRetry.addEventListener("click", async () => {
    const text = els.text.value.trim();
    if (!text) return;
    els.status.textContent = "Đang dịch…";
    const tr = await window.qt.retranslate(text);
    els.status.textContent = tr.ok ? "Xong" : tr.detail || "Dịch thất bại";
    els.translated.textContent = tr.ok ? tr.translated : "";
  });

  els.btnCopy.addEventListener("click", async () => {
    const t = els.translated.textContent.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      els.btnCopy.textContent = "Đã sao chép";
      setTimeout(() => {
        els.btnCopy.textContent = "Sao chép dịch";
      }, 1200);
    } catch {
      /* ignore */
    }
  });
})();
