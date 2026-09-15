import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const summary = await readFile(new URL('../../docs/windows-phase-c-summary.md', import.meta.url), 'utf8')

test('Phase C summary records convergence and deferred acceptance accurately', () => {
  assert.match(summary, /already-functional Electron desktop shell/i)
  assert.match(summary, /No separate Windows application or React surface/i)
  assert.match(summary, /deliberately not converted into a CI pass/i)
})
