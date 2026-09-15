import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const policy = await readFile(new URL('../../docs/windows-phase-c-merge-policy.md', import.meta.url), 'utf8')

test('continuous workflow monitors fixes merges and advances only after main confirmation', () => {
  assert.match(policy, /monitor the Phase C PR/i)
  assert.match(policy, /diagnose and fix failures/i)
  assert.match(policy, /merge it once required checks are green/i)
  assert.match(policy, /After confirming the merge on `main`, continue directly/i)
})
