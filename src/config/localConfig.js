import { defaultSelection } from '../data/catalog.js'
import { isStableTornadoId } from '../cloud/schema.js'

export const PORTABLE_CONFIG_SCHEMA_VERSION = 1
export const DEVICE_CONFIG_SCHEMA_VERSION = 1

export const PORTABLE_CONFIG_STORAGE_KEY = 'tornado-portable-config-v1'
export const DEVICE_CONFIG_STORAGE_KEY = 'tornado-device-config-v1'

const LEGACY_THEME_KEY = 'tornado-theme'
const LEGACY_SELECTION_KEY = 'tornado-selection'

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export function createDefaultPortableConfig() {
  return {
    schemaVersion: PORTABLE_CONFIG_SCHEMA_VERSION,
    appearance: { theme: 'dark' },
    launcher: { selectedItemIds: [...defaultSelection] },
    preferences: {},
  }
}

export function detectPlatform(userAgent = globalThis.navigator?.userAgent ?? '') {
  if (/Android/i.test(userAgent)) return 'android'
  if (/Windows/i.test(userAgent)) return 'windows'
  if (userAgent) return 'web'
  return 'unknown'
}

export function createDefaultDeviceConfig(platform = detectPlatform()) {
  return {
    schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    platform,
    launchTargets: {},
    nativePreferences: {},
  }
}

export function validatePortableConfig(value) {
  if (!isObject(value) || value.schemaVersion !== PORTABLE_CONFIG_SCHEMA_VERSION) return null
  if (!isObject(value.appearance) || !['dark', 'light'].includes(value.appearance.theme)) return null
  if (!isObject(value.launcher) || !Array.isArray(value.launcher.selectedItemIds)) return null
  if (value.launcher.selectedItemIds.length > 10) return null
  if (!value.launcher.selectedItemIds.every(isStableTornadoId)) return null
  if (new Set(value.launcher.selectedItemIds).size !== value.launcher.selectedItemIds.length) return null
  if (!isObject(value.preferences)) return null

  return {
    schemaVersion: PORTABLE_CONFIG_SCHEMA_VERSION,
    appearance: { theme: value.appearance.theme },
    launcher: { selectedItemIds: [...value.launcher.selectedItemIds] },
    preferences: { ...value.preferences },
  }
}

export function validateDeviceConfig(value) {
  if (!isObject(value) || value.schemaVersion !== DEVICE_CONFIG_SCHEMA_VERSION) return null
  if (!['web', 'android', 'windows', 'unknown'].includes(value.platform)) return null
  if (!isObject(value.launchTargets) || !isObject(value.nativePreferences)) return null

  return {
    schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    platform: value.platform,
    launchTargets: { ...value.launchTargets },
    nativePreferences: { ...value.nativePreferences },
  }
}

function parseStoredJson(storage, key) {
  try {
    const raw = storage?.getItem(key)
    return raw == null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function migrateLegacyLocalConfig(storage = globalThis.localStorage, platform = detectPlatform()) {
  const currentPortable = validatePortableConfig(parseStoredJson(storage, PORTABLE_CONFIG_STORAGE_KEY))
  const currentDevice = validateDeviceConfig(parseStoredJson(storage, DEVICE_CONFIG_STORAGE_KEY))

  if (currentPortable && currentDevice) {
    return { portable: currentPortable, device: currentDevice, migrated: false }
  }

  const defaults = createDefaultPortableConfig()
  const legacyTheme = parseStoredJson(storage, LEGACY_THEME_KEY)
  const legacySelection = parseStoredJson(storage, LEGACY_SELECTION_KEY)

  const portable = currentPortable ?? validatePortableConfig({
    ...defaults,
    appearance: { theme: legacyTheme === 'light' || legacyTheme === 'dark' ? legacyTheme : defaults.appearance.theme },
    launcher: {
      selectedItemIds: Array.isArray(legacySelection)
        ? legacySelection.filter(isStableTornadoId).filter((id, index, ids) => ids.indexOf(id) === index).slice(0, 10)
        : defaults.launcher.selectedItemIds,
    },
  }) ?? defaults

  const device = currentDevice ?? createDefaultDeviceConfig(platform)
  const portableWritten = currentPortable ? true : safeWrite(storage, PORTABLE_CONFIG_STORAGE_KEY, portable)
  const deviceWritten = currentDevice ? true : safeWrite(storage, DEVICE_CONFIG_STORAGE_KEY, device)

  if (portableWritten && deviceWritten) {
    try {
      storage?.removeItem(LEGACY_THEME_KEY)
      storage?.removeItem(LEGACY_SELECTION_KEY)
    } catch {
      // Removal is best-effort. The new versioned configuration is already durable.
    }
  }

  return { portable, device, migrated: !currentPortable || !currentDevice }
}

export function getPortableConfig(storage = globalThis.localStorage) {
  return migrateLegacyLocalConfig(storage).portable
}

export function updatePortableConfig(updater, storage = globalThis.localStorage) {
  const current = getPortableConfig(storage)
  const candidate = typeof updater === 'function' ? updater(current) : updater
  const validated = validatePortableConfig(candidate)
  if (!validated) return current
  safeWrite(storage, PORTABLE_CONFIG_STORAGE_KEY, validated)
  return validated
}

export function getDeviceConfig(storage = globalThis.localStorage) {
  return migrateLegacyLocalConfig(storage).device
}

export function updateDeviceConfig(updater, storage = globalThis.localStorage) {
  const current = getDeviceConfig(storage)
  const candidate = typeof updater === 'function' ? updater(current) : updater
  const validated = validateDeviceConfig(candidate)
  if (!validated) return current
  safeWrite(storage, DEVICE_CONFIG_STORAGE_KEY, validated)
  return validated
}
