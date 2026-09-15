import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-final-pr.md', import.meta.url), 'utf8')
test('final PR marker', () => assert.match(text, /Final PR marker/))
