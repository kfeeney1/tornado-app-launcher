import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-final-action.md', import.meta.url), 'utf8')
test('final action create PR', () => assert.match(text, /Final action: create PR/))
