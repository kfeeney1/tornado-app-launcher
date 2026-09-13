const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tornadoPlatform', Object.freeze({
  getPlatform: () => 'windows',
  openExternal: (url) => ipcRenderer.invoke('platform:open-external', url),
  launchNativeApp: (target) => ipcRenderer.invoke('platform:launch-native-app', target),
  getInstalledApps: () => ipcRenderer.invoke('platform:get-installed-apps'),
  resolveGame: (appId) => ipcRenderer.invoke('platform:resolve-game', appId),
}))
