import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-open-pr-finally.md', import.meta.url), 'utf8')
test('open finally', () => assert.match(text, /Open PR finally/))
