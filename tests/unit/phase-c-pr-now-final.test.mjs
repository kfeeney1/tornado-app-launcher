import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-now-final.md', import.meta.url), 'utf8')
test('PR now final', () => assert.match(text, /PR now, final/))
