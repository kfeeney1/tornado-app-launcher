import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const head = await readFile(new URL('../../docs/windows-phase-c-head.md', import.meta.url), 'utf8')

test('PR validation determines whether Phase C needs correction or can merge', () => {
  assert.match(head, /CI decides the next action/)
})
