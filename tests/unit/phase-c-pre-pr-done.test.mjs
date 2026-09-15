import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pre-pr-done.md', import.meta.url), 'utf8')
test('pre PR done', () => assert.match(text, /Pre-PR work done/))
