import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-last-action.md', import.meta.url), 'utf8')
test('last action', () => assert.match(text, /Last branch action before PR/))
