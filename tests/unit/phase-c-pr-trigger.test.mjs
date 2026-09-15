import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const trigger = await readFile(new URL('../../docs/windows-phase-c-pr-trigger.md', import.meta.url), 'utf8')

test('Phase C is at the PR trigger', () => assert.match(trigger, /PR now/))
