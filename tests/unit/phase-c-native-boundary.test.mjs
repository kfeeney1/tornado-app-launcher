import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const [main, preload] = await Promise.all([
  readFile(new URL('../../electron/main/index.cjs', import.meta.url), 'utf8'),
  readFile(new URL('../../electron/preload/index.cjs', import.meta.url), 'utf8'),
])

test('React receives native capabilities only through the restricted preload bridge', () => {
  assert.match(preload, /contextBridge/)
  assert.match(preload, /ipcRenderer/)
  assert.match(main, /ipcMain\.handle/)
  assert.doesNotMatch(preload, /require:\s*require|process:\s*process|fs:\s*require/)
})
