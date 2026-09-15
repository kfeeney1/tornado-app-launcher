import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-next.md', import.meta.url), 'utf8')
test('next create PR', () => assert.match(text, /Next: create pull request/))
