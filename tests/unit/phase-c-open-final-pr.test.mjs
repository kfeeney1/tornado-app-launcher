import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-open-final-pr.md', import.meta.url), 'utf8')
test('open final PR', () => assert.match(text, /Open final PR/))
