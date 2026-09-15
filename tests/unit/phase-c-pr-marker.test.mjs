import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const marker = await readFile(new URL('../../docs/windows-phase-c-pr-marker.md', import.meta.url), 'utf8')

test('post-PR Phase C changes are limited to genuine CI or review corrections', () => {
  assert.match(marker, /intended initial PR head/i)
  assert.match(marker, /CI-driven fixes or review-driven corrections/i)
  assert.match(marker, /until the PR is green/i)
})
