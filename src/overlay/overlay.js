(() => {
  const box = document.getElementById("box");
  const hint = document.getElementById("hint");
  let startX = 0;
  let startY = 0;
  let selecting = false;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      window.qt.cancel();
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    selecting = true;
    startX = e.clientX;
    startY = e.clientY;
    box.hidden = false;
    hint.style.display = "none";
    update(startX, startY, 0, 0);
  });

  document.addEventListener("mousemove", (e) => {
    if (!selecting) return;
    const x = Math.min(startX, e.clientX);
    const y = Math.min(startY, e.clientY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    update(x, y, w, h);
  });

  document.addEventListener("mouseup", async (e) => {
    if (!selecting) return;
    selecting = false;
    const x = Math.min(startX, e.clientX);
    const y = Math.min(startY, e.clientY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);

    if (w < 8 || h < 8) {
      window.qt.cancel();
      return;
    }

    await window.qt.complete({ x, y, w, h });
  });

  function update(x, y, w, h) {
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
  }
})();
