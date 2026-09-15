import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-final-head.md', import.meta.url), 'utf8')
test('final pre-PR head', () => assert.match(text, /Final pre-PR head marker/))
