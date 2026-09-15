import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-final-now.md', import.meta.url), 'utf8')
test('final now PR', () => assert.match(text, /Final now: PR/))
