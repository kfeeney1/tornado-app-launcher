import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-terminal.md', import.meta.url), 'utf8')
test('terminal marker', () => assert.match(text, /Terminal pre-PR marker/))
