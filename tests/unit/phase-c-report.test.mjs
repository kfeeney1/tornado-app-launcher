import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const report = await readFile(new URL('../../docs/windows-phase-c-report.md', import.meta.url), 'utf8')

test('Phase C report captures required roadmap gate fields', () => {
  assert.match(report, /Start SHA:/)
  assert.match(report, /Web regression:/)
  assert.match(report, /Windows package build:/)
  assert.match(report, /Real-machine packaged verification: deferred, not passed/i)
  assert.match(report, /Phase D only after PR green \+ merged \+ `main` re-inspected/i)
})
