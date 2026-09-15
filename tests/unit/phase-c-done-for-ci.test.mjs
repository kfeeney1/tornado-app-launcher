import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const gate = await readFile(new URL('../../docs/windows-phase-c-done-for-ci.md', import.meta.url), 'utf8')

test('branch preparation hands off to monitor-fix-merge sequence', () => {
  assert.match(gate, /Required CI is the next gate/i)
  assert.match(gate, /Fix failures on this branch/i)
  assert.match(gate, /merge only green/i)
  assert.match(gate, /create Phase D from that verified merge commit/i)
})
