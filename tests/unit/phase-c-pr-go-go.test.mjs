import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-go-go.md', import.meta.url), 'utf8')
test('go go', () => assert.match(text, /Go go PR/))
