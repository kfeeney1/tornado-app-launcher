import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlatform, PLATFORM_CAPABILITIES } from '../src/platform/index.js'

test('normal browser selects Web and opens allowed external URLs', async () => {
  let opened = null
  const web = createPlatform({ window: { open: url => { opened = url; return {} } } })
  assert.equal(web.kind, 'web')
  assert.equal(web.can(PLATFORM_CAPABILITIES.OPEN_EXTERNAL), true)
  assert.equal(web.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH), false)
  assert.deepEqual(await web.openExternal('https://example.com'), { ok: true, value: true })
  assert.equal(opened, 'https://example.com')
  assert.equal((await web.openExternal('javascript:alert(1)')).reason, 'invalid-url')
})

test('restricted Electron bridge selects Windows', async () => {
  let opened = null
  const windows = createPlatform({ window: { tornadoPlatform: {
    getPlatform: () => 'windows',
    openExternal: async url => { opened = url; return true },
  } } })
  assert.equal(windows.kind, 'windows')
  assert.equal(windows.can(PLATFORM_CAPABILITIES.OPEN_EXTERNAL), true)
  assert.equal(windows.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH), false)
  assert.deepEqual(await windows.openExternal('mailto:test@example.com'), { ok: true, value: true })
  assert.equal(opened, 'mailto:test@example.com')
})

test('missing or incomplete Electron bridge falls back safely to Web', () => {
  const platform = createPlatform({ window: { tornadoPlatform: { getPlatform: () => 'windows' }, open: () => ({}) } })
  assert.equal(platform.kind, 'web')
})

test('Capacitor Android selects Android and uses Browser plugin when available', async () => {
  let opened = null
  const android = createPlatform({ window: { Capacitor: {
    getPlatform: () => 'android',
    Plugins: { Browser: { open: async ({ url }) => { opened = url } } },
  } } })
  assert.equal(android.kind, 'android')
  assert.equal(android.can(PLATFORM_CAPABILITIES.OPEN_EXTERNAL), true)
  assert.deepEqual(await android.openExternal('https://example.com/android'), { ok: true, value: true })
  assert.equal(opened, 'https://example.com/android')
})

test('unsupported native launch is explicit on every Phase 2 adapter', async () => {
  const platform = createPlatform({ window: { open: () => ({}) } })
  assert.deepEqual(await platform.launchTarget({ type: 'registered-app', appId: 'roblox' }), {
    ok: false,
    reason: 'unsupported',
    capability: 'native-app-launch',
    platform: 'web',
  })
})
