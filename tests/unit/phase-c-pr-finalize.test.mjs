import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-finalize.md', import.meta.url), 'utf8')
test('PR preparation finalized', () => assert.match(text, /PR preparation finalized/))
