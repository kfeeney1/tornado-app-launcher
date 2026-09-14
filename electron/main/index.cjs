const { app, BrowserWindow, ipcMain, shell, screen } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { resolveNativeLaunchTarget } = require('./nativeLaunch.cjs')
const { discoverInstalledApps } = require('./installedApps.cjs')
const { resolveInstalledGame } = require('./gameResolver.cjs')
const { createLocalLogger } = require('./logger.cjs')

const DEV_RENDERER_URL = process.env.TORNADO_RENDERER_URL || ''
const isDev = Boolean(DEV_RENDERER_URL)
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])
const DEFAULT_WINDOW_BOUNDS = Object.freeze({ width: 1280, height: 800 })
const MIN_WINDOW_BOUNDS = Object.freeze({ width: 900, height: 620 })
const WINDOW_STATE_FILE = 'window-state.json'
let mainWindow = null
let windowStateTimer = null
let logger = null

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) app.quit()

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

function windowStatePath() {
  return path.join(app.getPath('userData'), WINDOW_STATE_FILE)
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function intersectsDisplay(bounds) {
  return screen.getAllDisplays().some(({ workArea }) => {
    const right = bounds.x + bounds.width
    const bottom = bounds.y + bounds.height
    const workRight = workArea.x + workArea.width
    const workBottom = workArea.y + workArea.height
    return right > workArea.x && bounds.x < workRight && bottom > workArea.y && bounds.y < workBottom
  })
}

function readWindowState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(windowStatePath(), 'utf8'))
    const width = isFiniteNumber(parsed.width) ? Math.max(parsed.width, MIN_WINDOW_BOUNDS.width) : DEFAULT_WINDOW_BOUNDS.width
    const height = isFiniteNumber(parsed.height) ? Math.max(parsed.height, MIN_WINDOW_BOUNDS.height) : DEFAULT_WINDOW_BOUNDS.height
    const candidate = {
      width,
      height,
      ...(isFiniteNumber(parsed.x) && isFiniteNumber(parsed.y) ? { x: parsed.x, y: parsed.y } : {}),
    }
    if ('x' in candidate && !intersectsDisplay(candidate)) return { ...DEFAULT_WINDOW_BOUNDS }
    return candidate
  } catch {
    logger?.warn('window-state-recovery')
    return { ...DEFAULT_WINDOW_BOUNDS }
  }
}

function persistWindowState(win) {
  if (!win || win.isDestroyed() || win.isMinimized() || win.isMaximized() || win.isFullScreen()) return
  const bounds = win.getBounds()
  try {
    fs.writeFileSync(windowStatePath(), JSON.stringify(bounds), 'utf8')
  } catch {
    logger?.warn('window-state-persist-failed')
  }
}

function scheduleWindowStateSave(win) {
  clearTimeout(windowStateTimer)
  windowStateTimer = setTimeout(() => persistWindowState(win), 250)
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function registerIpc() {
  ipcMain.handle('platform:open-external', async (_event, value) => {
    if (typeof value !== 'string' || !isAllowedExternalUrl(value)) throw new Error('Unsupported external URL')
    await shell.openExternal(value)
    return true
  })

  ipcMain.handle('platform:launch-native-app', async (_event, payload) => {
    const target = resolveNativeLaunchTarget(payload)
    if (!target) throw new Error('Unsupported native launch target')
    try {
      await shell.openExternal(target)
      return true
    } catch (error) {
      logger?.error('native-launch-failed', { errorName: error?.name || 'Error' })
      throw error
    }
  })

  ipcMain.handle('platform:get-installed-apps', async () => {
    try { return await discoverInstalledApps() }
    catch (error) { logger?.error('app-discovery-failed', { errorName: error?.name || 'Error' }); throw error }
  })

  ipcMain.handle('platform:resolve-game', async (_event, appId) => {
    if (typeof appId !== 'string') throw new Error('Unsupported game resolution request')
    try {
      const resolution = await resolveInstalledGame(appId)
      if (!resolution) throw new Error('Unsupported game resolution request')
      return resolution
    } catch (error) {
      logger?.error('game-resolution-failed', { errorName: error?.name || 'Error' })
      throw error
    }
  })
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow
  const restoredBounds = readWindowState()
  const win = new BrowserWindow({
    ...restoredBounds,
    minWidth: MIN_WINDOW_BOUNDS.width,
    minHeight: MIN_WINDOW_BOUNDS.height,
    title: 'Tornado',
    show: false,
    center: !('x' in restoredBounds),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })
  mainWindow = win

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
  win.webContents.on('did-fail-load', (_event, errorCode) => logger?.error('renderer-load-failed', { errorCode }))

  win.on('resize', () => scheduleWindowStateSave(win))
  win.on('move', () => scheduleWindowStateSave(win))
  win.on('close', () => persistWindowState(win))
  win.on('closed', () => { if (mainWindow === win) mainWindow = null })
  win.once('ready-to-show', () => win.show())

  if (isDev) {
    void win.loadURL(DEV_RENDERER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  return win
}

if (hasSingleInstanceLock) {
  app.on('second-instance', () => focusMainWindow())

  app.whenReady().then(() => {
    logger = createLocalLogger(path.join(app.getPath('userData'), 'logs'))
    logger.info('startup', { version: app.getVersion(), platform: process.platform })
    registerIpc()
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else focusMainWindow()
    })
  })
}

app.on('window-all-closed', () => {
  logger?.info('shutdown', { platform: process.platform })
  if (process.platform !== 'darwin') app.quit()
})
