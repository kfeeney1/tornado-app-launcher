import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-ready-absolute.md', import.meta.url), 'utf8')
test('PR ready', () => assert.match(text, /PR-ready/))
