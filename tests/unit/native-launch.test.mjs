import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createPlatform, PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { launchApp } from '../../src/platform/launchService.js'

const require = createRequire(import.meta.url)
const { resolveNativeLaunchTarget } = require('../../electron/main/nativeLaunch.cjs')

test('Windows adapter exposes native launch only when restricted bridge supports it', async () => {
  let payload = null
  const windows = createPlatform({ window: { tornadoPlatform: {
    getPlatform: () => 'windows',
    openExternal: async () => true,
    launchNativeApp: async value => { payload = value; return true },
  } } })

  assert.equal(windows.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH), true)
  assert.deepEqual(await windows.launchTarget({ appId: 'minecraft', type: 'protocol', protocol: 'ignored://value' }), { ok: true, value: true })
  assert.deepEqual(payload, { appId: 'minecraft', type: 'protocol' })
})

test('Windows adapter rejects malformed targets before IPC', async () => {
  let calls = 0
  const windows = createPlatform({ window: { tornadoPlatform: {
    getPlatform: () => 'windows',
    openExternal: async () => true,
    launchNativeApp: async () => { calls += 1; return true },
  } } })

  assert.equal((await windows.launchTarget({ type: 'protocol' })).reason, 'invalid-target')
  assert.equal((await windows.launchTarget({ appId: 'minecraft', type: 'windows-path' })).reason, 'invalid-target')
  assert.equal(calls, 0)
})

test('Electron trusted boundary resolves only allowlisted Tornado app IDs', () => {
  assert.equal(resolveNativeLaunchTarget({ appId: 'minecraft', type: 'protocol' }), 'minecraft://')
  assert.match(resolveNativeLaunchTarget({ appId: 'fortnite', type: 'protocol' }), /^com\.epicgames\.launcher:/)
  assert.equal(resolveNativeLaunchTarget({ appId: 'unknown', type: 'protocol' }), null)
  assert.equal(resolveNativeLaunchTarget({ appId: 'minecraft', type: 'protocol', command: 'calc.exe' }), null)
  assert.equal(resolveNativeLaunchTarget('minecraft://'), null)
})

test('shared launch service uses native Windows launch and web fallback safely', async () => {
  const item = { id: 'minecraft', type: 'game', launchUrl: 'minecraft://', installUrl: 'https://www.minecraft.net/download' }
  const nativeCalls = []
  const nativePlatform = {
    kind: 'windows',
    launchTarget: async target => { nativeCalls.push(target.appId); return { ok: true, value: true } },
    openExternal: async () => { throw new Error('fallback should not run') },
  }
  assert.deepEqual(await launchApp(item, nativePlatform), { ok: true, value: true })
  assert.deepEqual(nativeCalls, ['minecraft'])

  let fallback = null
  const webPlatform = {
    kind: 'web',
    launchTarget: async () => ({ ok: false, reason: 'unsupported' }),
    openExternal: async url => { fallback = url; return { ok: true, value: true } },
  }
  assert.deepEqual(await launchApp(item, webPlatform), { ok: true, value: true })
  assert.equal(fallback, 'https://www.minecraft.net/download')
})
