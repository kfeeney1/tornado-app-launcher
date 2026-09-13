import { test, expect } from '@playwright/test'
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
} from '../src/config/localConfig.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

test('portable and device defaults are versioned and separate', async () => {
  const portable = createDefaultPortableConfig()
  const device = createDefaultDeviceConfig('android')
  expect(portable.schemaVersion).toBe(1)
  expect(portable.appearance.theme).toBe('dark')
  expect(portable.launcher.selectedItemIds).toContain('minecraft')
  expect(device).toEqual({ schemaVersion: 1, platform: 'android', launchTargets: {}, nativePreferences: {} })
  expect(portable).not.toHaveProperty('platform')
})

test('legacy local settings migrate without losing order or appearance', async () => {
  const storage = memoryStorage({
    'tornado-theme': JSON.stringify('light'),
    'tornado-selection': JSON.stringify(['spotify', 'browser', 'roblox', 'minecraft']),
  })
  const first = migrateLegacyLocalConfig(storage, 'windows')
  expect(first.migrated).toBeTruthy()
  expect(first.portable.appearance.theme).toBe('light')
  expect(first.portable.launcher.selectedItemIds).toEqual(['spotify', 'browser', 'roblox', 'minecraft'])
  expect(first.device.platform).toBe('windows')
  const second = migrateLegacyLocalConfig(storage, 'windows')
  expect(second.migrated).toBeFalsy()
  expect(second.portable).toEqual(first.portable)
  expect(storage.snapshot()).not.toHaveProperty('tornado-theme')
  expect(storage.snapshot()).not.toHaveProperty('tornado-selection')
})

test('malformed data safely falls back to defaults', async () => {
  const storage = memoryStorage({
    'tornado-portable-config-v1': '{not-json',
    'tornado-device-config-v1': JSON.stringify({ schemaVersion: 99 }),
  })
  expect(getPortableConfig(storage)).toEqual(createDefaultPortableConfig())
  expect(getDeviceConfig(storage).schemaVersion).toBe(1)
})

test('validators reject invalid schemas and duplicate IDs', async () => {
  expect(validatePortableConfig({ schemaVersion: 99 })).toBeNull()
  expect(validatePortableConfig({ schemaVersion: 1, appearance: { theme: 'dark' }, launcher: { selectedItemIds: ['roblox', 'roblox'] }, preferences: {} })).toBeNull()
  expect(validateDeviceConfig({ schemaVersion: 1, platform: 'android', launchTargets: [], nativePreferences: {} })).toBeNull()
})

test('portable and device updates cannot overwrite each other', async () => {
  const storage = memoryStorage()
  const beforeDevice = getDeviceConfig(storage)
  updatePortableConfig(config => ({ ...config, appearance: { theme: 'light' } }), storage)
  expect(getPortableConfig(storage).appearance.theme).toBe('light')
  expect(getDeviceConfig(storage)).toEqual(beforeDevice)
  updateDeviceConfig(config => ({ ...config, nativePreferences: { reducedNativeEffects: true } }), storage)
  expect(getDeviceConfig(storage).nativePreferences.reducedNativeEffects).toBe(true)
  expect(getPortableConfig(storage).appearance.theme).toBe('light')
})
