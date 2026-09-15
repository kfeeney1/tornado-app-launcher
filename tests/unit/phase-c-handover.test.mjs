import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const handover = await readFile(new URL('../../docs/windows-phase-c-handover.md', import.meta.url), 'utf8')

test('Phase D starts only after Phase C merge verification', () => {
  assert.match(handover, /when and only when the Phase C PR is green and merged/i)
  assert.match(handover, /inspect the resulting `main` SHA/i)
  assert.match(handover, /Phase D.*may begin/is)
  assert.match(handover, /cannot declare packaged Windows acceptance complete/i)
})
