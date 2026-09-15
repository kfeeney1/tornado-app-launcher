import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const gate = await readFile(new URL('../../docs/windows-phase-c-final-gate.md', import.meta.url), 'utf8')

test('Phase C final gate preserves sequential start SHA and deferred release blocker', () => {
  assert.match(gate, /green Phase C PR/i)
  assert.match(gate, /resulting `main` commit is the only valid start point for Phase D/i)
  assert.match(gate, /tracked blocker for full Phase D acceptance and Phase E release readiness/i)
})
