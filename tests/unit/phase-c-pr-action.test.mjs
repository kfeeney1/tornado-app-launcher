import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const action = await readFile(new URL('../../docs/windows-phase-c-pr-action.md', import.meta.url), 'utf8')
test('Phase C action is PR against main', () => assert.match(action, /Open PR against main/))
