import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const body = await readFile(new URL('../../docs/windows-phase-c-pr-body.md', import.meta.url), 'utf8')

test('Phase C PR evidence records scope security and merge gate', () => {
  assert.match(body, /Start SHA:/)
  assert.match(body, /shared Electron shell/i)
  assert.match(body, /No Windows-only React application/i)
  assert.match(body, /monitored and fixed until green before merge/i)
  assert.match(body, /release blocking/i)
})
