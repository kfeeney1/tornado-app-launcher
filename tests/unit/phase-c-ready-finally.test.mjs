import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-ready-finally.md', import.meta.url), 'utf8')
test('finally ready', () => assert.match(text, /Finally ready for PR creation/))
