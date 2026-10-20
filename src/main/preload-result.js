const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("qt", {
  onData: (cb) => {
    ipcRenderer.on("result:data", (_e, data) => cb(data));
  },
  close: () => ipcRenderer.invoke("result:close"),
  retranslate: (text) => ipcRenderer.invoke("result:retranslate", text),
});
