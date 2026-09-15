import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-ready-open-pr.md', import.meta.url), 'utf8')
test('ready open', () => assert.match(text, /Ready to open PR/))
