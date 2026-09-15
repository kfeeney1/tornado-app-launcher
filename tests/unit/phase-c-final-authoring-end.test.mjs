import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-final-authoring-end.md', import.meta.url), 'utf8')
test('final authoring end', () => assert.match(text, /Final authoring end\. PR next/))
