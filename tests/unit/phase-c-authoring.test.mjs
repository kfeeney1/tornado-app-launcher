import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const handoff = await readFile(new URL('../../docs/windows-phase-c-stop-writing.md', import.meta.url), 'utf8')
test('Phase C authoring hands to PR tooling', () => assert.match(handoff, /Proceed with PR tooling/))
