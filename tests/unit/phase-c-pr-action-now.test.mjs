import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-action-now.md', import.meta.url), 'utf8')
test('PR action now', () => assert.match(text, /PR action now/))
