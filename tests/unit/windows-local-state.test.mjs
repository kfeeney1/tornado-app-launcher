import test from 'node:test'
import assert from 'node:assert/strict'
import { clearAccountOwnedLocalData } from '../../src/account/accountLocalData.js'
import { getDeviceConfig, getPortableConfig } from '../../src/config/localConfig.js'
import { PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { launchApp } from '../../src/platform/launchService.js'
import {
  WINDOWS_RESOLUTION_TTL_MS,
  cacheDiscoveredWindowsApps,
  cacheWindowsResolution,
  getCachedWindowsResolution,
  invalidateWindowsResolution,
} from '../../src/platform/windowsLocalState.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

test('Windows resolution evidence persists locally and expires deterministically', () => {
  const storage = memoryStorage()
  cacheWindowsResolution('minecraft', { installed: true, launcher: 'minecraft-launcher' }, storage, 1_000)

  assert.deepEqual(getCachedWindowsResolution('minecraft', storage, 1_001), {
    installed: true,
    launcher: 'minecraft-launcher',
    source: 'game-resolver',
    checkedAt: 1_000,
  })
  assert.equal(getCachedWindowsResolution('minecraft', storage, 1_000 + WINDOWS_RESOLUTION_TTL_MS + 1), null)
  assert.equal('installedApps' in getPortableConfig(storage), false)
})

test('bounded discovery evidence is machine local and keyed only by Tornado IDs', () => {
  const storage = memoryStorage()
  const ids = cacheDiscoveredWindowsApps([
    { appId: 'discord', source: 'start-menu', path: 'C:/secret/Discord.exe' },
    { appId: 'minecraft', source: 'start-menu', username: 'sam' },
    { appId: 'bad id', source: 'start-menu' },
  ], storage, 2_000)

  assert.deepEqual(ids, ['discord', 'minecraft'])
  const device = getDeviceConfig(storage)
  assert.deepEqual(device.installedApps.discord, { installed: true, launcher: null, source: 'discovery', checkedAt: 2_000 })
  assert.equal(JSON.stringify(device).includes('C:/secret'), false)
  assert.equal(JSON.stringify(device).includes('sam'), false)
})

test('native launch failure invalidates stale local resolution before fallback', async () => {
  const storage = memoryStorage()
  cacheWindowsResolution('minecraft', { installed: true, launcher: 'minecraft-launcher' }, storage, 3_000)
  let resolverCalls = 0
  let fallback = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => {
      resolverCalls += 1
      return { ok: true, value: { appId: 'minecraft', installed: true, launcher: 'minecraft-launcher' } }
    },
    launchTarget: async () => ({ ok: false, reason: 'launch-failed' }),
    openExternal: async url => { fallback = url; return { ok: true, value: true } },
  }
  const item = { id: 'minecraft', type: 'game', launchUrl: 'minecraft://', installUrl: 'https://www.minecraft.net/download' }

  await launchApp(item, platform, { storage, now: 3_001 })
  assert.equal(resolverCalls, 0)
  assert.equal(fallback, 'https://www.minecraft.net/download')
  assert.equal(getCachedWindowsResolution('minecraft', storage, 3_002), null)
})

test('stale cache triggers fresh local resolution and refreshes persistence', async () => {
  const storage = memoryStorage()
  cacheWindowsResolution('roblox', { installed: false, launcher: 'roblox' }, storage, 1)
  let resolverCalls = 0
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => {
      resolverCalls += 1
      return { ok: true, value: { appId: 'roblox', installed: true, launcher: 'roblox' } }
    },
    launchTarget: async () => ({ ok: true, value: true }),
    openExternal: async () => ({ ok: true, value: true }),
  }
  const now = WINDOWS_RESOLUTION_TTL_MS + 10
  const item = { id: 'roblox', type: 'game', launchUrl: 'roblox://', installUrl: 'https://www.roblox.com/download' }

  assert.deepEqual(await launchApp(item, platform, { storage, now }), { ok: true, value: true })
  assert.equal(resolverCalls, 1)
  assert.equal(getCachedWindowsResolution('roblox', storage, now).installed, true)
})

test('account cleanup and switching do not remove machine-global Windows state', () => {
  const storage = memoryStorage({
    'tornado-account-portable-v1:user-a': JSON.stringify({ selected: ['minecraft'] }),
    'tornado-account-portable-v1:user-b': JSON.stringify({ selected: ['roblox'] }),
  })
  cacheWindowsResolution('minecraft', { installed: true, launcher: 'minecraft-launcher' }, storage, 4_000)
  const deviceBefore = getDeviceConfig(storage)

  assert.equal(clearAccountOwnedLocalData('user-a', storage), true)
  assert.equal(storage.getItem('tornado-account-portable-v1:user-a'), null)
  assert.notEqual(storage.getItem('tornado-account-portable-v1:user-b'), null)
  assert.deepEqual(getDeviceConfig(storage), deviceBefore)
})

test('explicit invalidation removes only the affected local app state', () => {
  const storage = memoryStorage()
  cacheWindowsResolution('minecraft', { installed: true, launcher: 'minecraft-launcher' }, storage, 5_000)
  cacheWindowsResolution('roblox', { installed: true, launcher: 'roblox' }, storage, 5_000)
  assert.equal(invalidateWindowsResolution('minecraft', storage), true)
  assert.equal(getCachedWindowsResolution('minecraft', storage, 5_001), null)
  assert.equal(getCachedWindowsResolution('roblox', storage, 5_001).installed, true)
})
