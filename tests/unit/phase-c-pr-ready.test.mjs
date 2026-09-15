import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const ready = await readFile(new URL('../../docs/windows-phase-c-pr-ready.md', import.meta.url), 'utf8')

test('Phase C moves from inspection to PR CI without skipping the gate', () => {
  assert.match(ready, /Live-state inspection is complete/i)
  assert.match(ready, /existing Electron implementation/i)
  assert.match(ready, /Open the Phase C PR/i)
  assert.match(ready, /required CI as the next authoritative gate/i)
})
