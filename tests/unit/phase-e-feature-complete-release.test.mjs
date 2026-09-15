import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const phaseD = await readFile(new URL('../../docs/windows-phase-d-packaged-acceptance.md', import.meta.url), 'utf8')
const phaseE = await readFile(new URL('../../docs/windows-phase-e-feature-complete-release.md', import.meta.url), 'utf8')
const releaseWorkflow = await readFile(new URL('../../.github/workflows/release-windows.yml', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))

test('Phase E preserves one shared product and explicit Windows-local boundary', () => {
  assert.match(phaseE, /shared React\/Vite product remains authoritative for Web and Windows/)
  assert.match(phaseE, /portable launcher configuration and settings remain account-owned and sync-capable/)
  assert.match(phaseE, /device-local\/native Windows resolution remains local to the device/)
  assert.match(phaseE, /Web behaviour remains supported by the same codebase/)
})

test('Phase E cannot convert deferred Windows acceptance into a CI pass', () => {
  assert.match(phaseD, /Phase D remains \*\*acceptance pending\*\*/)
  assert.match(phaseE, /feature-complete candidate — Windows acceptance pending/)
  assert.match(phaseE, /cannot reach the second state without the real-machine evidence/)
  assert.match(phaseE, /D1[–-]D6/)
})

test('final release reuses immutable candidate artifacts instead of rebuilding during promotion', () => {
  assert.match(releaseWorkflow, /Capture immutable source SHA/)
  assert.match(releaseWorkflow, /Refuse immutable version reuse/)
  assert.match(releaseWorkflow, /Promote identical candidate artifacts to stable/)
  const promote = releaseWorkflow.slice(releaseWorkflow.indexOf('  promote:'))
  assert.doesNotMatch(promote, /desktop:build/)
  assert.doesNotMatch(promote, /electron-builder/)
})

test('release candidate version must come from package metadata and advance rather than overwrite', () => {
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/)
  assert.match(releaseWorkflow, /SemVer matching package\.json/)
  assert.match(releaseWorkflow, /Release v\$\{\{ inputs\.version \}\} already exists; refusing to replace immutable release assets/)
  assert.match(phaseE, /choose the next unused SemVer release-candidate version rather than overwriting an existing release/)
})
