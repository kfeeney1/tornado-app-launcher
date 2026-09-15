import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-stage.md', import.meta.url), 'utf8')
test('enter PR stage', () => assert.match(text, /entering PR stage/))
