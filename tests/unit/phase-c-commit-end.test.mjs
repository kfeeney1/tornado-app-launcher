import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-commit-end.md', import.meta.url), 'utf8')
test('commit sequence end', () => assert.match(text, /Commit sequence end\. PR/))
