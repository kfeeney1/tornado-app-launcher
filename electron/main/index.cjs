const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const DEV_RENDERER_URL = process.env.TORNADO_RENDERER_URL || ''
const isDev = Boolean(DEV_RENDERER_URL)
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

function isAllowedExternalUrl(value) {
  try {
    const url = new URL(value)
    return ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

function isAllowedNavigation(value) {
  if (isDev) return value.startsWith(DEV_RENDERER_URL)
  const productionIndex = pathToFileURL(path.join(__dirname, '../../dist/index.html')).href
  return value === productionIndex || value.startsWith(`${productionIndex}#`)
}

function registerIpc() {
  ipcMain.handle('platform:open-external', async (_event, value) => {
    if (typeof value !== 'string' || !isAllowedExternalUrl(value)) {
      throw new Error('Unsupported external URL')
    }
    await shell.openExternal(value)
    return true
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    title: 'Tornado',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault()
      if (isAllowedExternalUrl(url)) void shell.openExternal(url)
    }
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    void win.loadURL(DEV_RENDERER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
