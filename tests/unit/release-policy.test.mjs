import test from 'node:test'
import assert from 'node:assert/strict'
import { compareSemver, evaluateUpdate, isTrustedWindowsArtifact, parseSemver } from '../../scripts/release-policy.mjs'

test('semantic versions compare numerically', () => {
  assert.equal(compareSemver('1.10.0', '1.9.9') > 0, true)
  assert.equal(compareSemver('1.2.0', '1.2.0'), 0)
  assert.equal(compareSemver('1.2.0-rc.2', '1.2.0-rc.10') < 0, true)
  assert.equal(compareSemver('1.2.0', '1.2.0-rc.1') > 0, true)
})

test('malformed semantic versions are rejected', () => {
  assert.equal(parseSemver('1.2'), null)
  assert.equal(parseSemver('01.2.3'), null)
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0', candidateVersion: 'latest' }), { accepted: false, reason: 'malformed-version' })
})

test('stable update channel blocks prereleases, equal versions, and downgrades', () => {
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0', candidateVersion: '1.3.0-rc.1' }), { accepted: false, reason: 'prerelease-blocked' })
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0', candidateVersion: '1.2.0' }), { accepted: false, reason: 'same-version' })
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0', candidateVersion: '1.1.9' }), { accepted: false, reason: 'downgrade-blocked' })
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0', candidateVersion: '1.2.1' }), { accepted: true, reason: 'newer-version' })
})

test('preview channel may accept a newer prerelease', () => {
  assert.deepEqual(evaluateUpdate({ currentVersion: '1.2.0-rc.1', candidateVersion: '1.2.0-rc.2', channel: 'preview' }), { accepted: true, reason: 'newer-version' })
})

test('only the expected Windows installer filename is trusted', () => {
  assert.equal(isTrustedWindowsArtifact('Tornado-Setup-1.2.0.exe', '1.2.0'), true)
  assert.equal(isTrustedWindowsArtifact('Other-Setup-1.2.0.exe', '1.2.0'), false)
  assert.equal(isTrustedWindowsArtifact('Tornado-Setup-1.2.1.exe', '1.2.0'), false)
})
