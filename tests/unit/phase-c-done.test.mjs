import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-done.md', import.meta.url), 'utf8')
test('done authoring', () => assert.match(text, /Done authoring\. PR/))
