import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-branch-done.md', import.meta.url), 'utf8')
test('branch done PR next', () => assert.match(text, /Branch done; PR next/))
