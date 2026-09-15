import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const known = await readFile(new URL('../../docs/windows-phase-c-known-issues.md', import.meta.url), 'utf8')

test('Phase C treats CI failures as defects rather than bypassing required checks', () => {
  assert.match(known, /CI failures discovered.*are defects/is)
  assert.match(known, /must not be merged around required checks/i)
  assert.match(known, /actual packaged Windows interaction cannot currently be performed/i)
})
