import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const marker = await readFile(new URL('../../docs/windows-phase-c-final-marker.md', import.meta.url), 'utf8')

test('Phase C final marker encodes continuous gated progression', () => {
  assert.match(marker, /Create PR, monitor CI, fix if needed, merge when green, verify main, advance sequentially/i)
})
