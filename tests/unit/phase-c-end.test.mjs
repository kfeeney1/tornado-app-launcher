import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const end = await readFile(new URL('../../docs/windows-phase-c-end.md', import.meta.url), 'utf8')

test('Phase C has no further planned additions before CI', () => assert.match(end, /No further planned branch additions before PR CI/))
