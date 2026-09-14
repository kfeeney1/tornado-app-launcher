import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createPlatform, PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { launchApp } from '../../src/platform/launchService.js'

const require = createRequire(import.meta.url)
const { resolveNativeLaunchRequest, resolveNativeLaunchTarget } = require('../../electron/main/nativeLaunch.cjs')

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

test('Electron trusted boundary resolves only allowlisted Tornado protocol IDs', () => {
  assert.equal(resolveNativeLaunchTarget({ appId: 'minecraft', type: 'protocol' }), 'minecraft://')
  assert.match(resolveNativeLaunchTarget({ appId: 'fortnite', type: 'protocol' }), /^com\.epicgames\.launcher:/)
  assert.equal(resolveNativeLaunchTarget({ appId: 'unknown', type: 'protocol' }), null)
  assert.equal(resolveNativeLaunchTarget({ appId: 'minecraft', type: 'protocol', command: 'calc.exe' }), null)
  assert.equal(resolveNativeLaunchTarget('minecraft://'), null)
})

test('installed Windows apps resolve through trusted local discovery, never renderer paths', async () => {
  let requestedId = null
  const resolved = await resolveNativeLaunchRequest(
    { appId: 'discord', type: 'installed-app' },
    { findInstalledAppShortcut: async appId => { requestedId = appId; return 'C:\\Start Menu\\Discord.lnk' } },
  )
  assert.deepEqual(resolved, { kind: 'path', value: 'C:\\Start Menu\\Discord.lnk' })
  assert.equal(requestedId, 'discord')

  assert.equal(await resolveNativeLaunchRequest(
    { appId: 'unknown', type: 'installed-app' },
    { findInstalledAppShortcut: async () => 'C:\\bad.exe' },
  ), null)
  assert.equal(await resolveNativeLaunchRequest({ appId: 'discord', type: 'installed-app', executablePath: 'C:\\Windows\\System32\\calc.exe' }), null)
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

test('installed Windows app launches natively and repairs stale discovery once before Web fallback', async () => {
  const item = { id: 'discord', type: 'app', url: 'https://discord.com/app' }
  let discoveryCalls = 0
  let launchCalls = 0
  let fallback = null
  const platform = {
    kind: 'windows',
    can: capability => [PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY, PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH].includes(capability),
    getInstalledApps: async () => {
      discoveryCalls += 1
      return { ok: true, value: [{ appId: 'discord', source: 'start-menu' }] }
    },
    launchTarget: async target => {
      assert.equal(target.type, 'installed-app')
      launchCalls += 1
      return launchCalls === 1 ? { ok: false, reason: 'launch-failed' } : { ok: true, value: true }
    },
    openExternal: async url => { fallback = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(launchCalls, 2)
  assert.equal(discoveryCalls, 2)
  assert.equal(fallback, null)
})

test('missing installed Windows app uses its Web destination without native launch', async () => {
  const item = { id: 'notion', type: 'app', url: 'https://www.notion.so' }
  let launchCalls = 0
  let opened = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY,
    getInstalledApps: async () => ({ ok: true, value: [] }),
    launchTarget: async () => { launchCalls += 1; return { ok: true, value: true } },
    openExternal: async url => { opened = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(launchCalls, 0)
  assert.equal(opened, 'https://www.notion.so')
})
