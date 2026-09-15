import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const acceptance = await readFile(new URL('../../docs/windows-phase-c-desktop-experience.md', import.meta.url), 'utf8')

test('Phase C never represents unavailable real-Windows checks as passed', () => {
  assert.match(acceptance, /acceptance debt, not a pass/i)
  assert.match(acceptance, /blocking before Phase D can be declared fully accepted/i)
  assert.match(acceptance, /before any feature-complete\/release-ready claim/i)
})
