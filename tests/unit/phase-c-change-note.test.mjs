import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const note = await readFile(new URL('../../docs/windows-phase-c-change-note.md', import.meta.url), 'utf8')

test('Phase C accurately classifies its evidence-driven hardening work', () => {
  assert.match(note, /verification\/hardening work/i)
  assert.match(note, /target desktop behaviours already implemented/i)
  assert.match(note, /Production-code changes are reserved for defects/i)
})
