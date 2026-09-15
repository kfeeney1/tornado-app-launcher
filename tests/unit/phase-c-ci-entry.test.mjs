import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const entry = await readFile(new URL('../../docs/windows-phase-c-ci-entry.md', import.meta.url), 'utf8')

test('Phase C enters PR CI before any Phase D work', () => {
  assert.match(entry, /next action is PR creation and required Quality CI/i)
  assert.match(entry, /Do not start Phase D from this branch/i)
})
