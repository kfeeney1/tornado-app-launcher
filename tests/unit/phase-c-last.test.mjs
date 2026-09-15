import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const marker = await readFile(new URL('../../docs/windows-phase-c-last.md', import.meta.url), 'utf8')
test('last marker says open', () => assert.match(marker, /Open it/))
