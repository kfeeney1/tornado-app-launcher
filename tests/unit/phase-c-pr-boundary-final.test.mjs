import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-boundary-final.md', import.meta.url), 'utf8')
test('at boundary', () => assert.match(text, /At PR boundary/))
