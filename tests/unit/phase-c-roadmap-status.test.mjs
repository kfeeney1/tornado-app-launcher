import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const status = await readFile(new URL('../../docs/windows-phase-c-roadmap-status.md', import.meta.url), 'utf8')

test('roadmap status does not prematurely start Phase D or E', () => {
  assert.match(status, /Phase C: in PR\/CI preparation/i)
  assert.match(status, /Phase D: not started/i)
  assert.match(status, /Phase E: not started/i)
  assert.match(status, /remain release blockers/i)
})
