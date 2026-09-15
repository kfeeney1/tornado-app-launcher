import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-no-more.md', import.meta.url), 'utf8')
test('authoring ended', () => assert.match(text, /No more planned authoring before PR/))
