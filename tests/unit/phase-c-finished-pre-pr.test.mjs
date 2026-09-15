import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-finished-pre-pr.md', import.meta.url), 'utf8')
test('finished pre PR', () => assert.match(text, /Finished pre-PR/))
