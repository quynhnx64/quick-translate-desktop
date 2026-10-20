const screenshot = require("screenshot-desktop");

/**
 * Chụp full màn hình (primary). Trả Buffer PNG.
 * screenshot-desktop trên Windows dùng các display; screen = 0 là primary.
 */
async function captureScreen(screen = 0) {
  return screenshot({ format: "png", screen });
}

module.exports = { captureScreen };
