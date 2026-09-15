import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-finish.md', import.meta.url), 'utf8')
test('finish PR', () => assert.match(text, /Finish\. PR/))
