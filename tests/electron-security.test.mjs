import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const main = await readFile(new URL('../electron/main/index.cjs', import.meta.url), 'utf8')
const preload = await readFile(new URL('../electron/preload/index.cjs', import.meta.url), 'utf8')

test('BrowserWindow keeps renderer isolated from Node', () => {
  assert.match(main, /contextIsolation:\s*true/)
  assert.match(main, /nodeIntegration:\s*false/)
  assert.match(main, /sandbox:\s*true/)
  assert.match(main, /webSecurity:\s*true/)
})

test('navigation and new windows are restricted', () => {
  assert.match(main, /setWindowOpenHandler/)
  assert.match(main, /will-navigate/)
  assert.match(main, /platform:open-external/)
})

test('preload exposes only narrow platform capabilities', () => {
  assert.match(preload, /contextBridge\.exposeInMainWorld\('tornadoPlatform'/)
  assert.match(preload, /getPlatform/)
  assert.match(preload, /openExternal/)
  assert.doesNotMatch(preload, /\bexec\b|\bspawn\b|node:fs|require\(['"]fs['"]\)/)
})
