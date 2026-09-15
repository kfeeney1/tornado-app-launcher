import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const final = await readFile(new URL('../../docs/windows-phase-c-final.md', import.meta.url), 'utf8')

test('implementation-pass completion never bypasses PR CI or Windows acceptance', () => {
  assert.match(final, /ready for PR validation/i)
  assert.match(final, /does not mean the phase is merged/i)
  assert.match(final, /accepted on Windows/i)
  assert.match(final, /skip required CI/i)
})
