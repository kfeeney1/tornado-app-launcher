import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createPlatform, PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { clearInstalledAppsCache, getInstalledApps, isAppInstalled } from '../../src/platform/installedAppsService.js'

const require = createRequire(import.meta.url)
const {
  getStartMenuRoots,
  matchDiscoveredNames,
  matchTornadoAppId,
  normalizeName,
} = require('../../electron/main/installedApps.cjs')

test('normalizes and matches supported Start Menu shortcut names deterministically', () => {
  assert.equal(normalizeName('Minecraft Launcher.lnk'), 'minecraft launcher')
  assert.equal(matchTornadoAppId('Discord.lnk'), 'discord')
  assert.equal(matchTornadoAppId('Notion.url'), 'notion')
  assert.equal(matchTornadoAppId('Minecraft Launcher.lnk'), 'minecraft')
  assert.equal(matchTornadoAppId('Roblox Player.lnk'), 'roblox')
  assert.equal(matchTornadoAppId('Unrelated Tool.lnk'), null)
})

test('deduplicates discovered shortcuts and returns no local paths or raw software inventory', () => {
  const results = matchDiscoveredNames([
    'Discord.lnk',
    'Discord PTB.lnk',
    'Minecraft Launcher.lnk',
    'Roblox Player.lnk',
    'Unknown App.lnk',
    '',
  ])

  assert.deepEqual(results, [
    { appId: 'discord', source: 'start-menu' },
    { appId: 'minecraft', source: 'start-menu' },
    { appId: 'roblox', source: 'start-menu' },
  ])
  for (const item of results) {
    assert.deepEqual(Object.keys(item).sort(), ['appId', 'source'])
  }
})

test('Start Menu discovery roots are bounded to Windows registration locations', () => {
  const roots = getStartMenuRoots({ APPDATA: 'C:\\Users\\Sam\\AppData\\Roaming', PROGRAMDATA: 'C:\\ProgramData' })
  assert.equal(roots.length, 2)
  assert.match(roots[0], /Microsoft[\\/]Windows[\\/]Start Menu[\\/]Programs$/)
  assert.match(roots[1], /Microsoft[\\/]Windows[\\/]Start Menu[\\/]Programs$/)
  assert.equal(roots.some(root => /Program Files/i.test(root)), false)
})

test('Windows platform exposes discovery capability and sanitizes malformed bridge results', async () => {
  const windows = createPlatform({ window: { tornadoPlatform: {
    getPlatform: () => 'windows',
    openExternal: async () => true,
    launchNativeApp: async () => true,
    getInstalledApps: async () => [
      { appId: 'discord', source: 'start-menu', path: 'C:\\secret\\Discord.exe' },
      { appId: 'discord', source: 'start-menu' },
      { appId: 'minecraft', source: 'unexpected', username: 'sam' },
      { path: 'C:\\bad.exe' },
      null,
    ],
  } } })

  assert.equal(windows.can(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY), true)
  const result = await windows.getInstalledApps()
  assert.deepEqual(result, {
    ok: true,
    value: [
      { appId: 'discord', source: 'start-menu' },
      { appId: 'minecraft', source: 'windows' },
    ],
  })
})

test('shared installed app service caches discovery and matches Tornado IDs', async () => {
  clearInstalledAppsCache()
  let calls = 0
  const platform = {
    can: capability => capability === PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY,
    getInstalledApps: async () => {
      calls += 1
      return { ok: true, value: [{ appId: 'minecraft', source: 'start-menu' }] }
    },
  }

  assert.deepEqual(await getInstalledApps(platform), [{ appId: 'minecraft', source: 'start-menu' }])
  assert.equal(await isAppInstalled('minecraft', platform), true)
  assert.equal(await isAppInstalled('roblox', platform), false)
  assert.equal(calls, 1)
})

test('shared installed app service stays empty on unsupported platforms', async () => {
  clearInstalledAppsCache()
  const web = { can: () => false }
  assert.deepEqual(await getInstalledApps(web), [])
  assert.equal(await isAppInstalled('minecraft', web), false)
})
