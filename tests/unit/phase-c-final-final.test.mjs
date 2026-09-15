import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-final-final.md', import.meta.url), 'utf8')
test('final branch marker', () => assert.match(text, /Final branch marker before PR creation/))
