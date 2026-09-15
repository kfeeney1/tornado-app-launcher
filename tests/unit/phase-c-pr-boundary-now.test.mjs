import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-boundary-now.md', import.meta.url), 'utf8')
test('boundary now', () => assert.match(text, /PR boundary now/))
