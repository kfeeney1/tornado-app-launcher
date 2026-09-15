import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
const main = await read('electron/main/index.cjs')
const app = await read('src/App.jsx')

test('Windows desktop remains single-instance and restores the existing window', () => {
  assert.match(main, /requestSingleInstanceLock/)
  assert.match(main, /app\.on\('second-instance'/)
  assert.match(main, /mainWindow\.isMinimized\(\)/)
  assert.match(main, /mainWindow\.restore\(\)/)
  assert.match(main, /mainWindow\.show\(\)/)
  assert.match(main, /mainWindow\.focus\(\)/)
})

test('window geometry is local, bounded and recovered when off-screen', () => {
  assert.match(main, /app\.getPath\('userData'\)/)
  assert.match(main, /window-state\.json/)
  assert.match(main, /MIN_WINDOW_BOUNDS/)
  assert.match(main, /screen\.getAllDisplays\(\)/)
  assert.match(main, /intersectsDisplay/)
  assert.match(main, /win\.on\('resize'/)
  assert.match(main, /win\.on\('move'/)
})

test('desktop avoids startup flash and follows normal Windows close lifecycle', () => {
  assert.match(main, /show:\s*false/)
  assert.match(main, /ready-to-show/)
  assert.match(main, /window-all-closed/)
  assert.match(main, /process\.platform !== 'darwin'/)
  assert.match(main, /app\.quit\(\)/)
})

test('external navigation is allowlisted and arbitrary renderer navigation is denied', () => {
  assert.match(main, /ALLOWED_EXTERNAL_PROTOCOLS/)
  assert.match(main, /https:/)
  assert.match(main, /http:/)
  assert.match(main, /mailto:/)
  assert.match(main, /setWindowOpenHandler/)
  assert.match(main, /action:\s*'deny'/)
  assert.match(main, /will-navigate/)
  assert.match(main, /event\.preventDefault\(\)/)
})

test('Electron security boundary remains hardened', () => {
  assert.match(main, /contextIsolation:\s*true/)
  assert.match(main, /nodeIntegration:\s*false/)
  assert.match(main, /sandbox:\s*true/)
  assert.match(main, /webSecurity:\s*true/)
})

test('desktop Back returns home while Web retains explicit exit confirmation', () => {
  assert.match(app, /if \(isDesktop\(\)\)/)
  assert.match(app, /setView\('home'\)/)
  assert.match(app, /window\.confirm\('Exit Tornado\?'\)/)
})

test('desktop failures remain locally diagnosable', () => {
  assert.match(main, /renderer-load-failed/)
  assert.match(main, /native-launch-failed/)
  assert.match(main, /app-discovery-failed/)
  assert.match(main, /game-resolution-failed/)
})
