import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-terminal.md', import.meta.url), 'utf8')
test('terminal PR next', () => assert.match(text, /PR next/))
