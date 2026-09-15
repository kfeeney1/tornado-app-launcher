import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-branch-finalized.md', import.meta.url), 'utf8')
test('branch finalized', () => assert.match(text, /finalized for PR CI/))
