const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('osc', {
  onMessage: (handler) => {
    if (typeof handler !== 'function') return;
    ipcRenderer.on('osc-message', (_, message) => {
      handler(message);
    });
  },
});
