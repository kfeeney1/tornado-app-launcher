import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const prepared = await readFile(new URL('../../docs/windows-phase-c-complete-branch.md', import.meta.url), 'utf8')

test('Phase C prepared branch hands immediately to PR creation', () => {
  assert.match(prepared, /PR creation is the immediate next operation/i)
})
