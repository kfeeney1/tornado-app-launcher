import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-ready-ci.md', import.meta.url), 'utf8')
test('ready CI', () => assert.match(text, /Ready for PR CI/))
