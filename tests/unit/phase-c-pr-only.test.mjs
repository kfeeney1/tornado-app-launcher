import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-only.md', import.meta.url), 'utf8')
test('only PR CI actions next', () => assert.match(text, /Only PR\/CI actions next unless CI requires a fix/))
