import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const policy = await readFile(new URL('../../docs/windows-phase-c-automation.md', import.meta.url), 'utf8')

test('roadmap PR workflow is monitor fix merge verify advance', () => {
  assert.match(policy, /active CI inspection/i)
  assert.match(policy, /Required failures are fixed/i)
  assert.match(policy, /A green PR is merged/i)
  assert.match(policy, /merge commit on `main` is then verified/i)
  assert.match(policy, /without a separate user prompt for each merge/i)
})
