import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-final-pr-action.md', import.meta.url), 'utf8')
test('action PR', () => assert.match(text, /Action: PR/))
