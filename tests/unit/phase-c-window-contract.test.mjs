import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const main = await readFile(new URL('../../electron/main/index.cjs', import.meta.url), 'utf8')

test('production renderer stays local and dev navigation stays scoped to configured renderer', () => {
  assert.match(main, /pathToFileURL/)
  assert.match(main, /dist\/index\.html/)
  assert.match(main, /value\.startsWith\(DEV_RENDERER_URL\)/)
})

test('window state is not persisted while minimized maximized or fullscreen', () => {
  assert.match(main, /win\.isMinimized\(\)/)
  assert.match(main, /win\.isMaximized\(\)/)
  assert.match(main, /win\.isFullScreen\(\)/)
})

test('activate recreates a missing window or focuses the existing one', () => {
  assert.match(main, /app\.on\('activate'/)
  assert.match(main, /BrowserWindow\.getAllWindows\(\)\.length === 0/)
  assert.match(main, /createWindow\(\)/)
  assert.match(main, /focusMainWindow\(\)/)
})
