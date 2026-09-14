import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const main = await readFile(new URL('../electron/main/index.cjs', import.meta.url), 'utf8')
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')

test('desktop lifecycle uses one controlled main window', () => {
  assert.match(main, /requestSingleInstanceLock/)
  assert.match(main, /second-instance/)
  assert.match(main, /mainWindow\.isMinimized/)
  assert.match(main, /mainWindow\.restore/)
})

test('window geometry remains device-local and is validated before restore', () => {
  assert.match(main, /getPath\('userData'\)/)
  assert.match(main, /window-state\.json/)
  assert.match(main, /screen\.getAllDisplays/)
  assert.match(main, /MIN_WINDOW_BOUNDS/)
})

test('desktop Back returns to Tornado home while browser exit confirmation is retained', () => {
  assert.match(app, /isDesktop\(\)/)
  assert.match(app, /pushState\(rootHistoryState/)
  assert.match(app, /Exit Tornado\?/)
})
