import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const ready = await readFile(new URL('../../docs/windows-phase-c-ready.md', import.meta.url), 'utf8')

test('Phase C readiness is not confused with phase completion', () => {
  assert.match(ready, /complete enough to enter PR CI/i)
  assert.match(ready, /not declared complete until required CI passes and the PR is merged/i)
  assert.match(ready, /CI-discovered defect returns the phase to implementation\/fix state/i)
})
