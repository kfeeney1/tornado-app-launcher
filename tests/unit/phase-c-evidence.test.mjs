import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const evidence = await readFile(new URL('../../docs/windows-phase-c-evidence.md', import.meta.url), 'utf8')

test('Phase C evidence hierarchy keeps live code and real Windows execution authoritative', () => {
  assert.match(evidence, /Live repository implementation is authoritative/i)
  assert.match(evidence, /GitHub Actions checks are authoritative for automated/i)
  assert.match(evidence, /proves buildability, not successful end-user interaction/i)
  assert.match(evidence, /Real packaged Windows execution is authoritative/i)
})
