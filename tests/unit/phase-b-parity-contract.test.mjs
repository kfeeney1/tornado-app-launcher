import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const forbiddenPortableTerms = [
  'executablePath',
  'startMenuPath',
  'shortcutPath',
  'nativeLaunchTarget',
  'installedApps',
  'gameResolutions',
]

test('portable sync architecture is account scoped and split into independent domains', async () => {
  const [cache, backend, docs] = await Promise.all([
    read('src/sync/accountCache.js'),
    read('src/sync/syncBackend.js'),
    read('docs/stage-4-cross-device-sync.md'),
  ])

  assert.match(cache, /tornado-account-portable-v1:/)
  assert.match(backend, /appearance/)
  assert.match(backend, /launcher/)
  assert.match(backend, /preferences/)
  assert.match(docs, /stable Tornado catalogue IDs only/)
})

test('portable sync source does not persist Windows native resolution fields', async () => {
  const portableSources = await Promise.all([
    read('src/sync/accountCache.js'),
    read('src/sync/reconciliation.js'),
    read('src/sync/syncBackend.js'),
    read('src/sync/syncLogic.js'),
  ])
  const source = portableSources.join('\n')

  for (const term of forbiddenPortableTerms) {
    assert.doesNotMatch(source, new RegExp(`\\b${term}\\b`), `portable sync must not contain ${term}`)
  }
})

test('Windows native resolution remains behind the platform/device-local boundary', async () => {
  const [windowsState, launchResolver, windowsAdapter] = await Promise.all([
    read('src/platform/windowsLocalState.js'),
    read('src/platform/launchResolver.js'),
    read('src/platform/adapters/windows.js'),
  ])

  assert.match(windowsState, /device/i)
  assert.match(launchResolver, /windows/i)
  assert.match(windowsAdapter, /launchNativeApp/)
})

test('device registry has an explicit Windows platform without executable path fields', async () => {
  const deviceTypes = await read('src/devices/deviceTypes.js')

  assert.match(deviceTypes, /['"]windows['"]/) 
  assert.doesNotMatch(deviceTypes, /executablePath|shortcutPath|startMenuPath|nativeLaunchTarget/)
})

test('Phase B acceptance keeps deferred Windows verification explicit', async () => {
  const acceptance = await read('docs/windows-phase-b-parity-acceptance.md')

  assert.match(acceptance, /scheduling exception, not an acceptance waiver/i)
  assert.match(acceptance, /inherited Phase A debt/i)
  assert.match(acceptance, /blocking regression/i)
})
