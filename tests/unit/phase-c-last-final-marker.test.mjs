import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-last-final-marker.md', import.meta.url), 'utf8')
test('last final marker', () => assert.match(text, /Open PR/))
