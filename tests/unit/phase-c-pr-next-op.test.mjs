import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-next-op.md', import.meta.url), 'utf8')
test('next op create PR', () => assert.match(text, /Next op = create PR/))
