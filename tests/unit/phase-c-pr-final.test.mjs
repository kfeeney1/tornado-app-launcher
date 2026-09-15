import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const checkpoint = await readFile(new URL('../../docs/windows-phase-c-pr-final.md', import.meta.url), 'utf8')

test('Phase C final checkpoint requires merge and main verification before Phase D', () => {
  assert.match(checkpoint, /Observe Quality/)
  assert.match(checkpoint, /Repair failures/)
  assert.match(checkpoint, /Merge green/)
  assert.match(checkpoint, /Verify main/)
  assert.match(checkpoint, /Then and only then start Phase D/)
})
