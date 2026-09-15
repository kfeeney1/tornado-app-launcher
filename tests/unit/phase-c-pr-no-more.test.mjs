import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
const text = await readFile(new URL('../../docs/windows-phase-c-pr-no-more.md', import.meta.url), 'utf8')
test('no more create PR', () => assert.match(text, /No more\. Create PR/))
