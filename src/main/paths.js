const path = require("path");
const { app } = require("electron");

/** Thư mục resource ngoài asar (tessdata, icon khi đóng gói). */
function resourcesDir() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.resolve(__dirname, "../../assets");
}

function tessdataCachePath() {
  return resourcesDir();
}

function iconPath() {
  return path.join(resourcesDir(), "icon.png");
}

module.exports = { resourcesDir, tessdataCachePath, iconPath };
