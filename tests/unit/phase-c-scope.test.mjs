import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const scope = await readFile(new URL('../../docs/windows-phase-c-scope.md', import.meta.url), 'utf8')

test('Phase C stays focused on desktop product behaviour and shared parity', () => {
  assert.match(scope, /single-instance behaviour/i)
  assert.match(scope, /shared navigation\/Back behaviour/i)
  assert.match(scope, /Explicitly excluded: tray mode/i)
  assert.match(scope, /Windows-only React screens/i)
})
