import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-ready-final.md', import.meta.url), 'utf8')
test('final ready marker', () => assert.match(text, /open PR/))
