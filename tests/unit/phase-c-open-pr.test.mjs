import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const checkpoint = await readFile(new URL('../../docs/windows-phase-c-open-pr.md', import.meta.url), 'utf8')

test('open-PR checkpoint retains required-check discipline', () => {
  assert.match(checkpoint, /Open the PR against `main`/)
  assert.match(checkpoint, /monitor required checks/i)
  assert.match(checkpoint, /correct genuine failures before merge/i)
})
