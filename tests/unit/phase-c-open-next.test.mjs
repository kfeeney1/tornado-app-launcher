import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-open-next.md', import.meta.url), 'utf8')
test('open next', () => assert.match(text, /Open PR next/))
