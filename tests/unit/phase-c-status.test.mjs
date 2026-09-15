import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const status = await readFile(new URL('../../docs/windows-phase-c-status.md', import.meta.url), 'utf8')

test('Phase C status requires green merge verification before Phase D', () => {
  assert.match(status, /awaiting PR CI/i)
  assert.match(status, /Phase B merge verified on `main`/i)
  assert.match(status, /Phase D remains unopened until Phase C is green, merged and verified on `main`/i)
})
