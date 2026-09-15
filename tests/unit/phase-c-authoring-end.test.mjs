import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-authoring-end.md', import.meta.url), 'utf8')
test('authoring ended', () => assert.match(text, /PR gate next/))
