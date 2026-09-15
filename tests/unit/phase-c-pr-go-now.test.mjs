import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-go-now.md', import.meta.url), 'utf8')
test('go now', () => assert.match(text, /Go PR now/))
