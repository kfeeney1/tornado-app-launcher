import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-create-now-final.md', import.meta.url), 'utf8')
test('create now final', () => assert.match(text, /Create PR now\. Final/))
