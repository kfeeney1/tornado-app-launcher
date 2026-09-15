import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-now-pr.md', import.meta.url), 'utf8')
test('now PR', () => assert.match(text, /Now PR/))
