import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const ci = await readFile(new URL('../../docs/windows-phase-c-ci.md', import.meta.url), 'utf8')

test('Phase C requires monitor-fix-rerun-merge workflow', () => {
  assert.match(ci, /Monitor every required Quality job/i)
  assert.match(ci, /commit the fix to the same Phase C branch/i)
  assert.match(ci, /Repeat until green/i)
  assert.match(ci, /Do not bypass, disable or weaken a required check/i)
})
