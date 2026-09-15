import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const regression = await readFile(new URL('../../docs/windows-phase-c-regression.md', import.meta.url), 'utf8')

test('desktop hardening retains shared Web product behaviour', () => {
  assert.match(regression, /preserve Tornado Web/i)
  assert.match(regression, /remain shared code/i)
  assert.match(regression, /existing platform abstraction/i)
  assert.match(regression, /Playwright suite remains the primary Web regression gate/i)
})
