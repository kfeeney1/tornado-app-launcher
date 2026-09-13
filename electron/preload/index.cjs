const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tornadoPlatform', Object.freeze({
  getPlatform: () => 'windows',
  openExternal: (url) => ipcRenderer.invoke('platform:open-external', url),
}))
