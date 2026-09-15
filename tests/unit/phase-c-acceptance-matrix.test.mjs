import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const matrix = await readFile(new URL('../../docs/windows-phase-c-acceptance-matrix.md', import.meta.url), 'utf8')

test('Phase C matrix distinguishes automated and real Windows evidence', () => {
  assert.match(matrix, /Automated evidence/)
  assert.match(matrix, /Real Windows evidence/)
  assert.match(matrix, /Windows packaging/)
  assert.match(matrix, /Deferred means unexecuted, not passed/i)
})
