import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const gate = await readFile(new URL('../../docs/windows-phase-c-ci-gate.md', import.meta.url), 'utf8')

test('Quality CI is authoritative at the Phase C PR boundary', () => {
  assert.match(gate, /Quality CI is authoritative from here until merge/i)
})
