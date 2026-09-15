import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-ready-merge-process.md', import.meta.url), 'utf8')
test('ready process', () => assert.match(text, /PR monitor\/fix\/merge process/))
