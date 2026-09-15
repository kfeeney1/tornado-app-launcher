import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-no-more-files.md', import.meta.url), 'utf8')
test('no more files', () => assert.match(text, /No more files\. PR next/))
