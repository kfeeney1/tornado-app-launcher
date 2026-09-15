import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const review = await readFile(new URL('../../docs/windows-phase-c-final-review.md', import.meta.url), 'utf8')

test('Phase C pre-PR review avoids unsupported real-machine claims', () => {
  assert.match(review, /ready for CI review/i)
  assert.match(review, /no unsupported claim/i)
  assert.match(review, /real Windows machine/i)
  assert.match(review, /durable deferred-test register/i)
})
