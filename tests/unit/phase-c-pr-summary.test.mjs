import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const summary = await readFile(new URL('../../docs/windows-phase-c-pr-summary.md', import.meta.url), 'utf8')

test('Phase C PR summary does not overclaim unavailable Windows evidence', () => {
  assert.match(summary, /core desktop lifecycle already implemented/i)
  assert.match(summary, /Required CI remains the merge gate/i)
  assert.match(summary, /Real Windows acceptance remains explicitly deferred and release blocking/i)
})
