import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const gate = await readFile(new URL('../../docs/windows-phase-c-completion.md', import.meta.url), 'utf8')

test('Phase C completion semantics require green CI and preserve real-machine debt', () => {
  assert.match(gate, /only after required Quality CI is green/i)
  assert.match(gate, /not real-machine acceptance/i)
  assert.match(gate, /main.*re-inspected before Phase D/is)
  assert.match(gate, /release blocking/i)
})
