import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-open-pr-now.md', import.meta.url), 'utf8')
test('open PR now', () => assert.match(text, /Open PR now/))
