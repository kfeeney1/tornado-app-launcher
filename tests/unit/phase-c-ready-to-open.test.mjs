import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const ready = await readFile(new URL('../../docs/windows-phase-c-ready-to-open.md', import.meta.url), 'utf8')
test('Phase C is ready for PR', () => assert.match(ready, /Phase C -> PR/))
