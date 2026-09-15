import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const boundary = await readFile(new URL('../../docs/windows-phase-c-release-boundary.md', import.meta.url), 'utf8')

test('Phase C automated completion cannot promote or declare release readiness', () => {
  assert.match(boundary, /does not promote a release/i)
  assert.match(boundary, /satisfy the deferred Windows acceptance register/i)
  assert.match(boundary, /feature-complete claim/i)
})
