import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const workflow = await readFile(new URL('../../.github/workflows/release-windows.yml', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../../docs/windows-phase-d-packaged-acceptance.md', import.meta.url), 'utf8')

test('Windows release candidate pins source and validates before packaging', () => {
  assert.match(workflow, /Capture immutable source SHA/)
  assert.match(workflow, /needs: validate/)
  assert.match(workflow, /Verify pinned source SHA/)
  assert.match(workflow, /npm run lint/)
  assert.match(workflow, /node --test tests\/unit\/\*\.test\.mjs/)
  assert.match(workflow, /npm run desktop:test/)
  assert.match(workflow, /npm run test:smoke/)
})

test('Windows package gate exercises unpacked executable and immutable installer evidence', () => {
  assert.match(workflow, /Smoke unpacked release build/)
  assert.match(workflow, /release\/win-unpacked\/Tornado\.exe/)
  assert.match(workflow, /npm run desktop:build/)
  assert.match(workflow, /Get-FileHash -Algorithm SHA256/)
  assert.match(workflow, /create-release-manifest\.mjs/)
  assert.match(workflow, /Tornado-Setup-\$\{\{ inputs\.version \}\}\.exe\.sha256/)
  assert.match(workflow, /release-manifest\.json/)
})

test('stable promotion reuses the validated candidate rather than rebuilding', () => {
  const promoteIndex = workflow.indexOf('  promote:')
  assert.notEqual(promoteIndex, -1)
  const promote = workflow.slice(promoteIndex)
  assert.match(promote, /Download and validate the existing candidate assets/)
  assert.match(promote, /checksum verification failed/)
  assert.match(promote, /Promote identical candidate artifacts to stable/)
  assert.doesNotMatch(promote, /desktop:build/)
  assert.doesNotMatch(promote, /electron-builder/)
})

test('Phase D explicitly requires real Windows installation acceptance', () => {
  for (const marker of [
    'D1 — clean install',
    'D2 — shared product journeys',
    'D3 — native Windows app launch',
    'D4 — game lifecycle',
    'D5 — Windows desktop behaviour',
    'D6 — upgrade and rollback regression',
    'acceptance pending',
    'blocking regression',
  ]) {
    assert.match(acceptance, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(acceptance, /not evidence that an installer has been installed and exercised by a person on a real Windows machine/)
  assert.match(acceptance, /must not be declared feature-complete or release-ready until this gate is satisfied/)
})
