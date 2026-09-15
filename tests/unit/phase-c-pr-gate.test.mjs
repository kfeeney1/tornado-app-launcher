import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const checklist = await readFile(new URL('../../docs/windows-phase-c-pr-checklist.md', import.meta.url), 'utf8')

test('Phase C PR gate preserves sequential roadmap discipline', () => {
  assert.match(checklist, /Quality CI must pass before merge/i)
  assert.match(checklist, /Merge only after green CI/i)
  assert.match(checklist, /Re-inspect `main` after merge before starting Phase D/i)
})
