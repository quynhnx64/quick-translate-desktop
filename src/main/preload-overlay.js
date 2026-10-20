const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("qt", {
  cancel: () => ipcRenderer.invoke("overlay:cancel"),
  complete: (rect) => ipcRenderer.invoke("overlay:complete", rect),
});
