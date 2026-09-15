import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-end-authoring.md', import.meta.url), 'utf8')
test('end authoring now', () => assert.match(text, /End authoring now/))
