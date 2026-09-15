import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const review = await readFile(new URL('../../docs/windows-phase-c-review.md', import.meta.url), 'utf8')

test('Phase C converges the existing shell instead of adding speculative desktop scope', () => {
  assert.match(review, /No large desktop-shell rewrite is justified/i)
  assert.match(review, /single-instance behaviour/i)
  assert.match(review, /secure webPreferences/i)
  assert.match(review, /rather than introducing speculative tray\/startup\/notification functionality/i)
})
