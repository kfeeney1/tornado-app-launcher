import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const plan = await readFile(new URL('../../docs/windows-phase-c-test-plan.md', import.meta.url), 'utf8')

test('desktop test plan distinguishes CI package evidence from real Windows acceptance', () => {
  assert.match(plan, /GitHub Actions cannot establish subjective Windows shell behaviour/i)
  assert.match(plan, /execute the Phase C entries/i)
  assert.match(plan, /do not reinterpret CI package success as equivalent evidence/i)
})
