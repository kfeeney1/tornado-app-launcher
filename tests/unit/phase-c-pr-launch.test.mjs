import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const launch = await readFile(new URL('../../docs/windows-phase-c-pr-launch.md', import.meta.url), 'utf8')

test('Phase C PR branch cannot contain Phase D implementation', () => {
  assert.match(launch, /ready for the repository's PR\/Quality gate/i)
  assert.match(launch, /No Phase D implementation belongs on this branch/i)
})
