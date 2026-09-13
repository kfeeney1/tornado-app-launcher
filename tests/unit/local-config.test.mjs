import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDefaultDeviceConfig,
  createDefaultPortableConfig,
  getDeviceConfig,
  getPortableConfig,
  migrateLegacyLocalConfig,
  updateDeviceConfig,
  updatePortableConfig,
  validateDeviceConfig,
  validatePortableConfig,
} from '../../src/config/localConfig.js'
import { resolveLaunchTarget } from '../../src/platform/launchResolver.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

test('portable and device defaults are explicit and versioned', () => {
  const portable = createDefaultPortableConfig()
  const device = createDefaultDeviceConfig('android')
  assert.equal(portable.schemaVersion, 1)
  assert.equal(portable.appearance.theme, 'dark')
  assert.ok(portable.launcher.selectedItemIds.includes('minecraft'))
  assert.deepEqual(device, { schemaVersion: 1, platform: 'android', installationId: null, launchTargets: {}, nativePreferences: {} })
  assert.equal('platform' in portable, false)
})

test('legacy migration preserves selection order and appearance and is idempotent', () => {
  const storage = memoryStorage({
    'tornado-theme': JSON.stringify('light'),
    'tornado-selection': JSON.stringify(['spotify', 'roblox', 'browser', 'minecraft']),
  })
  const first = migrateLegacyLocalConfig(storage, 'windows')
  assert.equal(first.migrated, true)
  assert.equal(first.portable.appearance.theme, 'light')
  assert.deepEqual(first.portable.launcher.selectedItemIds, ['spotify', 'roblox', 'browser', 'minecraft'])
  assert.equal(first.device.platform, 'windows')
  const second = migrateLegacyLocalConfig(storage, 'windows')
  assert.equal(second.migrated, false)
  assert.deepEqual(second.portable, first.portable)
  assert.equal(storage.getItem('tornado-theme'), null)
  assert.equal(storage.getItem('tornado-selection'), null)
})

test('device-specific state remains local across repeat loads', () => {
  const device = {
    schemaVersion: 1,
    platform: 'windows',
    installationId: null,
    launchTargets: { minecraft: { executablePath: 'C:/Games/Minecraft.exe' } },
    nativePreferences: { monitor: 2 },
  }
  const storage = memoryStorage({ 'tornado-device-config-v1': JSON.stringify(device) })
  migrateLegacyLocalConfig(storage, 'windows')
  assert.deepEqual(getDeviceConfig(storage), device)
  assert.equal(getPortableConfig(storage).launcher.selectedItemIds.includes('minecraft'), true)
  assert.equal('launchTargets' in getPortableConfig(storage), false)
})

test('malformed data safely falls back without crashing', () => {
  const storage = memoryStorage({
    'tornado-portable-config-v1': '{not-json',
    'tornado-device-config-v1': JSON.stringify({ schemaVersion: 1, platform: 'android', launchTargets: [], nativePreferences: {} }),
  })
  assert.deepEqual(getPortableConfig(storage), createDefaultPortableConfig())
  assert.equal(getDeviceConfig(storage).schemaVersion, 1)
})

test('unsupported future schema is preserved rather than overwritten', () => {
  const futurePortable = { schemaVersion: 2, future: true }
  const storage = memoryStorage({ 'tornado-portable-config-v1': JSON.stringify(futurePortable) })
  const result = migrateLegacyLocalConfig(storage, 'web')
  assert.equal(result.unsupportedFutureSchema, true)
  assert.deepEqual(JSON.parse(storage.getItem('tornado-portable-config-v1')), futurePortable)
  updatePortableConfig(config => ({ ...config, appearance: { theme: 'light' } }), storage)
  assert.deepEqual(JSON.parse(storage.getItem('tornado-portable-config-v1')), futurePortable)
})

test('validators reject invalid schemas, duplicate IDs and malformed device config', () => {
  assert.equal(validatePortableConfig({ schemaVersion: 99 }), null)
  assert.equal(validatePortableConfig({ schemaVersion: 1, appearance: { theme: 'dark' }, launcher: { selectedItemIds: ['roblox', 'roblox'] }, preferences: {} }), null)
  assert.equal(validateDeviceConfig({ schemaVersion: 1, platform: 'android', launchTargets: [], nativePreferences: {} }), null)
})

test('portable and device updates do not overwrite each other', () => {
  const storage = memoryStorage()
  const beforeDevice = getDeviceConfig(storage)
  updatePortableConfig(config => ({ ...config, appearance: { theme: 'light' } }), storage)
  assert.equal(getPortableConfig(storage).appearance.theme, 'light')
  assert.deepEqual(getDeviceConfig(storage), beforeDevice)
  updateDeviceConfig(config => ({ ...config, nativePreferences: { reducedNativeEffects: true } }), storage)
  assert.equal(getDeviceConfig(storage).nativePreferences.reducedNativeEffects, true)
  assert.equal(getPortableConfig(storage).appearance.theme, 'light')
})

test('platform resolver keeps Android fallback outside portable configuration', () => {
  const item = { id: 'roblox', type: 'game', launchUrl: 'roblox://', installUrl: 'https://www.roblox.com/download', playStoreUrl: 'https://play.google.com/roblox' }
  assert.deepEqual(resolveLaunchTarget(item, 'android'), {
    appId: 'roblox',
    type: 'protocol',
    protocol: 'roblox://',
    fallbackUrl: 'https://play.google.com/roblox',
  })
  assert.equal(resolveLaunchTarget(item, 'windows').fallbackUrl, 'https://www.roblox.com/download')
})
